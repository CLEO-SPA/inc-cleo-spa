import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

function emptyStringToNull(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) =>
      value === "" ? [key, null] : [key, value]
    )
  );
}

export const useVoucherTemplateFormStore = create(
  devtools((set, get) => ({
    // Main form data for voucher template
    mainFormData: {
      voucher_template_name: '',
      default_starting_balance: 0,
      default_free_of_charge: 0,
      default_total_price: 0,
      remarks: '',
      status: 'active',
      created_by: '',
      details: [],
    },

    // Service form for adding individual services to template
    serviceForm: {
      id: '',
      service_id: '',
      service_name: '',
      original_price: 0,
      custom_price: 0,
      discount: 0,
      final_price: 0,
      duration: 0,
      service_category_id: '',
    },

    // Available service options
    serviceOptions: [],
    
    // Loading and error states
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    error: null,

    // Current template ID for editing
    currentTemplateId: null,
    isEditMode: false,

    // Update main form fields
    updateMainField: (field, value) =>
      set(
        (state) => ({
          mainFormData: {
            ...state.mainFormData,
            [field]: value,
          },
        }),
        false,
        `updateMainField/${field}`
      ),

    // Load template data for editing
    loadTemplateForEdit: (templateData) => {
      set(
        {
          mainFormData: {
            voucher_template_name: templateData.voucher_template_name || '',
            default_starting_balance: templateData.default_starting_balance || 0,
            default_free_of_charge: templateData.default_free_of_charge || 0,
            default_total_price: templateData.default_total_price || 0,
            remarks: templateData.remarks || '',
            status: templateData.status || 'active',
            created_by: templateData.created_by || '',
            details: templateData.details || [],
          },
          currentTemplateId: templateData.id,
          isEditMode: true,
        },
        false,
        'loadTemplateForEdit'
      );
    },

    // Reset main form
    resetMainForm: () =>
      set(
        {
          mainFormData: {
            voucher_template_name: '',
            default_starting_balance: 0,
            default_free_of_charge: 0,
            default_total_price: 0,
            remarks: '',
            status: 'active',
            created_by: '',
            details: [],
          },
          currentTemplateId: null,
          isEditMode: false,
        },
        false,
        'resetMainForm'
      ),

    // Update service form fields
    updateServiceFormField: (field, value) =>
      set(
        (state) => {
          const updatedServiceForm = {
            ...state.serviceForm,
            [field]: value,
          };

          // Auto-calculate final price when custom_price or discount changes
          if (field === 'custom_price' || field === 'discount') {
            const customPrice = field === 'custom_price' ? value : updatedServiceForm.custom_price;
            const discount = field === 'discount' ? value : updatedServiceForm.discount;
            updatedServiceForm.final_price = customPrice - (customPrice * discount / 100);
          }

          return {
            serviceForm: updatedServiceForm,
          };
        },
        false,
        `updateServiceFormField/${field}`
      ),

    // Select service from dropdown
    selectService: (serviceData) => {
      const originalPrice = serviceData.price || 0;
      set(
        {
          serviceForm: {
            ...get().serviceForm,
            service_id: serviceData.id || serviceData.value,
            service_name: serviceData.name || serviceData.label,
            original_price: originalPrice,
            custom_price: originalPrice,
            final_price: originalPrice,
            duration: serviceData.duration || 0,
            service_category_id: serviceData.service_category_id || '',
            discount: 0,
          },
        },
        false,
        `selectService/${serviceData.id || serviceData.value}`
      );
    },

    // Reset service form
    resetServiceForm: () =>
      set(
        {
          serviceForm: {
            id: '',
            service_id: '',
            service_name: '',
            original_price: 0,
            custom_price: 0,
            discount: 0,
            final_price: 0,
            duration: 0,
            service_category_id: '',
          },
        },
        false,
        'resetServiceForm'
      ),

    // Add service to voucher template
    addServiceToTemplate: () => {
      const currentServiceForm = get().serviceForm;

      if (!currentServiceForm.service_id || !currentServiceForm.service_name) {
        console.warn('Cannot add an empty or incomplete service. Please select a service and specify details.');
        return;
      }

      // Check if service already exists in template
      const existingServiceIndex = get().mainFormData.details.findIndex(
        service => service.service_id === currentServiceForm.service_id
      );

      if (existingServiceIndex !== -1) {
        console.warn('This service is already added to the template.');
        return;
      }

      set(
        (state) => {
          const newDetails = [...state.mainFormData.details, { ...currentServiceForm }];
          
          // Auto-calculate total price based on all services
          const totalPrice = newDetails.reduce((sum, service) => sum + service.final_price, 0);

          return {
            mainFormData: {
              ...state.mainFormData,
              details: newDetails,
              default_total_price: totalPrice,
            },
            serviceForm: {
              id: '',
              service_id: '',
              service_name: '',
              original_price: 0,
              custom_price: 0,
              discount: 0,
              final_price: 0,
              duration: 0,
              service_category_id: '',
            },
          };
        },
        false,
        'addServiceToTemplate'
      );
    },

    // Remove service from template
    removeServiceFromTemplate: (serviceIndexToRemove) => {
      set(
        (state) => {
          const newDetails = state.mainFormData.details.filter((_, index) => index !== serviceIndexToRemove);
          
          // Recalculate total price
          const totalPrice = newDetails.reduce((sum, service) => sum + service.final_price, 0);

          return {
            mainFormData: {
              ...state.mainFormData,
              details: newDetails,
              default_total_price: totalPrice,
            },
          };
        },
        false,
        `removeServiceFromTemplate/${serviceIndexToRemove}`
      );
    },

    // Update service in template
    updateServiceInTemplate: (index, updatedServiceData) => {
      set(
        (state) => {
          const newDetails = [...state.mainFormData.details];
          if (newDetails[index]) {
            newDetails[index] = { ...newDetails[index], ...updatedServiceData };
            
            // Recalculate final price for this service
            const service = newDetails[index];
            service.final_price = service.custom_price - (service.custom_price * service.discount / 100);
          }

          // Recalculate total price
          const totalPrice = newDetails.reduce((sum, service) => sum + service.final_price, 0);

          return {
            mainFormData: {
              ...state.mainFormData,
              details: newDetails,
              default_total_price: totalPrice,
            },
          };
        },
        false,
        `updateServiceInTemplate/${index}`
      );
    },

    // Fetch service options
    fetchServiceOptions: async () => {
      set({ isLoading: true, error: null }, false, 'fetchServiceOptions/pending');
      try {
        const response = await api('/services/all');
        const formattedOptions = response.data.map((service) => ({
          value: service.id,
          label: service.name,
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration || 0,
          service_category_id: service.service_category_id || '',
        }));
        set({ serviceOptions: formattedOptions, isLoading: false }, false, 'fetchServiceOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchServiceOptions/rejected');
        console.error('Error fetching service options:', error);
      }
    },

    // Create voucher template
    createVoucherTemplate: async (templateData = null) => {
      set({ isCreating: true, error: null }, false, 'createVoucherTemplate/pending');
      try {
        const dataToSubmit = templateData || get().mainFormData;
        const cleanedData = emptyStringToNull(dataToSubmit);
        
        const timestamp = new Date().toISOString();
        const payload = {
          ...cleanedData,
          created_at: timestamp,
          updated_at: timestamp,
        };

        const response = await api.post('/voucher-templates', payload);
        
        set({ isCreating: false }, false, 'createVoucherTemplate/fulfilled');
        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create voucher template';
        set({ error: errorMessage, isCreating: false }, false, 'createVoucherTemplate/rejected');
        console.error('Error creating voucher template:', error);
        return { success: false, error: errorMessage };
      }
    },

    // Update voucher template
    updateVoucherTemplate: async (id = null, templateData = null) => {
      set({ isUpdating: true, error: null }, false, 'updateVoucherTemplate/pending');
      try {
        const templateId = id || get().currentTemplateId;
        const dataToSubmit = templateData || get().mainFormData;
        const cleanedData = emptyStringToNull(dataToSubmit);
        
        const timestamp = new Date().toISOString();
        const payload = {
          ...cleanedData,
          updated_at: timestamp,
        };

        const response = await api.put(`/voucher-templates/${templateId}`, payload);
        
        set({ isUpdating: false }, false, 'updateVoucherTemplate/fulfilled');
        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update voucher template';
        set({ error: errorMessage, isUpdating: false }, false, 'updateVoucherTemplate/rejected');
        console.error('Error updating voucher template:', error);
        return { success: false, error: errorMessage };
      }
    },

    // Save template (create or update based on mode)
    saveVoucherTemplate: async (templateData = null) => {
      const { isEditMode, currentTemplateId } = get();
      
      if (isEditMode && currentTemplateId) {
        return await get().updateVoucherTemplate(currentTemplateId, templateData);
      } else {
        return await get().createVoucherTemplate(templateData);
      }
    },

    // Set error
    setError: (error) => set({ error }, false, 'setError'),

    // Clear error
    clearError: () => set({ error: null }, false, 'clearError'),

    // Reset entire store
    reset: () => set({
      mainFormData: {
        voucher_template_name: '',
        default_starting_balance: 0,
        default_free_of_charge: 0,
        default_total_price: 0,
        remarks: '',
        status: 'active',
        created_by: '',
        details: [],
      },
      serviceForm: {
        id: '',
        service_id: '',
        service_name: '',
        original_price: 0,
        custom_price: 0,
        discount: 0,
        final_price: 0,
        duration: 0,
        service_category_id: '',
      },
      serviceOptions: [],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      error: null,
      currentTemplateId: null,
      isEditMode: false,
    }, false, 'reset'),
  }))
);