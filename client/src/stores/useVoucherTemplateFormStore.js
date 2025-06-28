import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';
import useServiceStore from './useServiceStore'; // Import the service store

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
      status: 'is_enabled',
      created_by: '',
      last_updated_by: '', // Add updated_by field
      created_at: null,
      updated_at: null, // Add updated_at field
      details: [],
    },
    // Remove the function-based selectors and make them reactive
    serviceOptions: [],
    servicesLoading: false,
    servicesError: null,

    // Sync with service store
    syncWithServiceStore: () => {
      const serviceState = useServiceStore.getState();
      set({
        serviceOptions: serviceState.services || [],
        servicesLoading: serviceState.loading,
        servicesError: serviceState.error
      });
    },
    // Service form for adding individual services to template
    serviceForm: {
      id: '',
      service_id: '',
      service_name: '',
      original_price: 0,
      custom_price: 0,
      discount: 1,
      final_price: 0,
      duration: 0,
      service_category_id: '',
    },

    // Loading and error states
    isCreating: false,
    isUpdating: false,
    error: null,

    // Current template ID for editing
    currentTemplateId: null,
    isEditMode: false,


    updateMainField: (field, value) =>
      set((state) => {
        const updatedForm = {
          ...state.mainFormData,
          [field]: value,
        };

        // Convert to numbers, defaulting to 0 for invalid values
        let starting = Number(updatedForm.default_starting_balance) || 0;
        let free = Number(updatedForm.default_free_of_charge) || 0;

        if (field === 'default_starting_balance') {
          starting = Number(value) || 0;
        } else if (field === 'default_free_of_charge') {
          free = Number(value) || 0;
        }

        // Validate: FOC must not exceed starting balance
        if (free > starting) {
          console.warn("Free of charge cannot exceed starting balance");

          const fixedForm = {
            ...updatedForm,
            default_free_of_charge: 0, // Set to 0 instead of empty string
            default_total_price: starting, // Keep as number
          };
          return { mainFormData: fixedForm };
        }
        console.log(`Updating field ${field} with value:`, value);
        console.log('Updated form data:', updatedForm);
        // Calculate total price and keep as number
        updatedForm.default_total_price = starting - free;
        return { mainFormData: updatedForm };
      }, false, `updateMainField/${field}`),



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
            status: templateData.status,
            created_by: templateData.created_by || '', // Keep original created_by
            last_updated_by: templateData.last_updated_by || '', // Use last_updated_by for edit mode
            created_at: templateData.created_at || null,
            updated_at: templateData.updated_at || null, // Include updated_at
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
            status: 'is_enabled',
            created_by: '',
            last_updated_by: '', // Reset updated_by
            created_at: null,
            updated_at: null, // Reset updated_at
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
          let updatedServiceForm = {
            ...state.serviceForm,
            [field]: value,
          };

          let customPrice = updatedServiceForm.custom_price;
          let discount = updatedServiceForm.discount;

          // Ensure numeric fields are not more than 2 decimal places
          const roundTo2Dp = (num) => Math.round(num * 100) / 100;

          if (field === 'discount') {
            if (value > 1) {
              console.warn("Discount cannot be more than 1");
              discount = 1;
            } else {
              discount = roundTo2Dp(value);
            }
            updatedServiceForm.discount = discount;
          }

          if (field === 'custom_price') {
            customPrice = roundTo2Dp(value);
            updatedServiceForm.custom_price = customPrice;
          }

          if (field === 'custom_price' || field === 'discount') {
            updatedServiceForm.final_price = roundTo2Dp(customPrice * discount);
          }

          return {
            serviceForm: updatedServiceForm,
          };
        },
        false,
        `updateServiceFormField/${field}`
      ),


    // Select service from dropdown and fetch its details
    selectService: async (serviceData) => {
      try {
        const serviceStore = useServiceStore.getState();

        // If essential details are missing, fetch full service
        let fullServiceData = serviceData;
        if (!serviceData.duration || !serviceData.service_price) {
          const serviceId = serviceData.id || serviceData.value;
          fullServiceData = await serviceStore.fetchServiceDetails(serviceId);
        }

        const originalPrice = parseFloat(fullServiceData.service_price) || 0;
        const duration = parseInt(fullServiceData.service_duration) || 0;

        set({
          serviceForm: {
            ...get().serviceForm,
            id: fullServiceData.id,
            service_id: fullServiceData.id,
            service_name: fullServiceData.service_name,
            original_price: originalPrice,
            custom_price: originalPrice,
            final_price: originalPrice,
            duration: duration,
            service_category_id: fullServiceData.service_category_id || '',
            discount: 1,
          },
        }, false, `selectService/${fullServiceData.id}`);
      } catch (error) {
        console.error('Error selecting service:', error);
        set({ error: 'Failed to load service details' }, false, 'selectService/error');
      }
    }
    ,

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
            discount: 1,
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

      if (!currentServiceForm.id || !currentServiceForm.service_name) {
        console.warn('Cannot add an empty or incomplete service. Please select a service and specify details.');
        return;
      }

      set(
        (state) => ({
          mainFormData: {
            ...state.mainFormData,
            details: [...state.mainFormData.details, { ...currentServiceForm }],
          },
        }),
        false,
        'addServiceToTemplate'
      );

      get().resetServiceForm();

    },

    // Remove service from template
    removeServiceFromTemplate: (serviceIndexToRemove) => {
      set(
        (state) => {
          const newDetails = state.mainFormData.details.filter((_, index) => index !== serviceIndexToRemove);

          return {
            mainFormData: {
              ...state.mainFormData,
              details: newDetails
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
            service.final_price = service.custom_price * service.discount ;
          }

          return {
            mainFormData: {
              ...state.mainFormData,
              details: newDetails,
            },
          };
        },
        false,
        `updateServiceInTemplate/${index}`
      );
    },

    // Get service options from service store
    getServiceOptions: () => {
      const serviceStore = useServiceStore.getState();
      return serviceStore.services.map(service => ({
        value: service.id,
        label: service.service_name,
        id: service.id,
        name: service.service_name,
      }));
    },

    // Check if services are loading
    isServicesLoading: () => {
      const serviceStore = useServiceStore.getState();
      return serviceStore.loading;
    },

    // Get services error
    getServicesError: () => {
      const serviceStore = useServiceStore.getState();
      return serviceStore.error;
    },

    // Fetch service options (delegates to service store)
    fetchServiceOptions: async () => {
      const serviceStore = useServiceStore.getState();
      return await serviceStore.fetchDropdownServices();
    },

    // Create voucher template
    createVoucherTemplate: async (templateData = null) => {
      set({ isCreating: true, error: null }, false, 'createVoucherTemplate/pending');
      try {
        const dataToSubmit = templateData || get().mainFormData;

        const starting = Number(dataToSubmit.default_starting_balance) || 0;
        const free = Number(dataToSubmit.default_free_of_charge) || 0;
        const total = Math.max(starting - free, 0);

        const currentDateTime = new Date().toISOString();

        // For creation, include created_by and set both created_at and updated_at to current datetime
        const cleanedData = emptyStringToNull({
          ...dataToSubmit,
          default_total_price: total,
          created_at: dataToSubmit.created_at || currentDateTime, // Use form value or current datetime
          updated_at: currentDateTime, // Always set to current datetime for new templates
          // Remove updated_by for creation
          last_updated_by: undefined,
        });

        const payload = {
          ...cleanedData,
        };

        set((state) => ({
          mainFormData: {
            ...state.mainFormData,
          }
        }), false, 'setCreatedAt');

        const response = await api.post('/voucher-template', payload);

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
        const starting = Number(dataToSubmit.default_starting_balance) || 0;
        const free = Number(dataToSubmit.default_free_of_charge) || 0;
        const total = Math.max(starting - free, 0);

        // For updates, include updated_by and set updated_at to current datetime
        const cleanedData = emptyStringToNull({
          ...dataToSubmit,
          default_total_price: total,
          updated_at: new Date().toISOString(), // Set current datetime for updates
          // Remove created_by for updates, but keep created_at (allow editing of creation datetime)
          created_by: undefined,
        });

        const payload = {
          ...cleanedData,
        };
        
        const response = await api.put(`/voucher-template/${templateId}`, payload);

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
        status: 'is_enabled',
        created_by: '',
        last_updated_by: '', // Reset updated_by
        created_at: null,
        updated_at: null, // Reset updated_at
        details: [],
      },
      serviceForm: {
        id: '',
        service_id: '',
        service_name: '',
        original_price: 0,
        custom_price: 0,
        discount: 1,
        final_price: 0,
        duration: 0,
        service_category_id: '',
      },
      isCreating: false,
      isUpdating: false,
      error: null,
      currentTemplateId: null,
      isEditMode: false,
    }, false, 'reset'),
  }))
);