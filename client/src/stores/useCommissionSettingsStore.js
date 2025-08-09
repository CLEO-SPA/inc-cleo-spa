import { create } from 'zustand';
import api from '@/services/api';
import { handleApiError } from '@/utils/errorHandlingUtils';

const getInitialState = () => ({
  // Data
  settings: {},
  originalSettings: {},
  
  // Loading states
  loading: false,
  saving: false,
  
  // UI states
  isEditing: false,
  success: false,
  error: false,
  errorMessage: null,
  
  // Validation
  hasChanges: false,
  validationErrors: {},
});

const useCommissionSettingsStore = create((set, get) => ({
  ...getInitialState(),

  // Fetch commission settings
  fetchCommissionSettings: async () => {
    if (get().loading) return;

    set({ loading: true, success: false, error: false, errorMessage: null });

    try {
      const response = await api.get('/com/commissionSettings');
      const rawSettingsData = response.data;

      console.log('Fetched raw commission settings:', rawSettingsData);

      // Filter out timestamp fields from the response
      const cleanSettingsData = {};
      Object.entries(rawSettingsData).forEach(([key, value]) => {
        if (key !== 'created_at' && key !== 'updated_at') {
          cleanSettingsData[key] = value;
        }
      });

      console.log('Cleaned commission settings:', cleanSettingsData);

      set({
        settings: cleanSettingsData,
        originalSettings: { ...cleanSettingsData },
        loading: false,
        success: false, // Don't show success for fetch
        error: false,
        errorMessage: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Error fetching commission settings:', errorMessage);
      set({ 
        error: true, 
        errorMessage: errorMessage, 
        loading: false,
        settings: {},
        originalSettings: {}
      });
    }
  },

  // Update commission settings
  updateCommissionSettings: async () => {
    if (get().saving) return;

    const { settings, hasChanges } = get();

    if (!hasChanges) {
      set({ error: true, errorMessage: "No changes to save." });
      return;
    }

    // Validate before saving
    const validation = get().validateSettings(settings);
    if (!validation.isValid) {
      set({ 
        error: true, 
        errorMessage: "Please fix validation errors before saving.",
        validationErrors: validation.errors 
      });
      return;
    }

    set({ saving: true, success: false, error: false, errorMessage: null });

    try {
      // Clean settings for API - filter out non-commission fields
      const cleanedSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        // Skip timestamp fields
        if (key === 'created_at' || key === 'updated_at') {
          return;
        }
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          cleanedSettings[key] = numValue;
        }
      });

      const response = await api.put('/com/commissionSettings', cleanedSettings);
      console.log('Commission settings saved successfully:', response.data);

      set({
        saving: false,
        success: true,
        error: false,
        errorMessage: null,
        isEditing: false,
        originalSettings: { ...settings },
        hasChanges: false,
        validationErrors: {},
      });

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        set(state => ({ ...state, success: false }));
      }, 3000);

    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Error saving commission settings:', errorMessage);
      
      set({ 
        error: true, 
        errorMessage: error.response?.data?.message || errorMessage, 
        saving: false 
      });
    }
  },

  // Update individual setting
  updateSetting: (key, value) => {
    const { settings } = get();
    
    const newSettings = {
      ...settings,
      [key]: value
    };
    set({
      settings: newSettings,
      hasChanges: get().checkForChanges(newSettings),
      validationErrors: get().clearValidationError(key),
    });
  },

  // Validation helper
  validateSettings: (settingsToValidate = null) => {
    const { settings } = get();
    const targetSettings = settingsToValidate || settings;
    const errors = {};
    let isValid = true;

    Object.entries(targetSettings).forEach(([key, value]) => {
      // Skip timestamp fields
      if (key === 'created_at' || key === 'updated_at') {
        return;
      }
      
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        errors[key] = 'Must be a valid number';
        isValid = false;
      } else if (numValue < 0) {
        errors[key] = 'Cannot be negative';
        isValid = false;
      } else if (numValue > 100) {
        errors[key] = 'Cannot exceed 100%';
        isValid = false;
      }
    });

    return { isValid, errors };
  },

  // Check if settings have changed from original
  checkForChanges: (newSettings) => {
    const { originalSettings } = get();
    
    // Only check commission fields, ignore timestamps
    const commissionKeys = Object.keys(newSettings).filter(key => 
      key !== 'created_at' && key !== 'updated_at'
    );
    
    return commissionKeys.some(key => 
      parseFloat(newSettings[key] || 0) !== parseFloat(originalSettings[key] || 0)
    );
  },

  // Clear validation error for specific field
  clearValidationError: (key) => {
    const { validationErrors } = get();
    const newErrors = { ...validationErrors };
    delete newErrors[key];
    return newErrors;
  },

  // UI actions
  startEditing: () => {
    set({ 
      isEditing: true, 
      error: false, 
      errorMessage: null,
      validationErrors: {} 
    });
  },

  cancelEditing: () => {
    const { originalSettings } = get();
    set({ 
      isEditing: false, 
      settings: { ...originalSettings },
      hasChanges: false,
      error: false, 
      errorMessage: null,
      validationErrors: {}
    });
  },

  clearError: () => {
    set({ error: false, errorMessage: null, validationErrors: {} });
  },

  reset: () => {
    set(getInitialState());
  }
}));

export default useCommissionSettingsStore;