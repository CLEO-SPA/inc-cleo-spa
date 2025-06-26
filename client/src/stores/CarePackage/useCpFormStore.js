import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

export const useCpFormStore = create(
  devtools((set, get) => ({
    mainFormData: {
      package_name: '',
      package_remarks: '',
      package_price: 0, // SUM(service.finalPrice * service.quantity)
      is_customizable: true,
      employee_id: '',
      services: [],
      created_at: '',
    },
    serviceForm: {
      id: '',
      name: '',
      quantity: 1,
      price: 0,
      finalPrice: 0, // price * discount
      discount: 1,
    },
    serviceOptions: [],
    isLoading: false,
    error: null,

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

    resetMainForm: () =>
      set(
        {
          mainFormData: {
            package_name: '',
            package_remarks: '',
            package_price: 0,
            is_customizable: true,
            employee_id: '',
            services: [],
            created_at: '',
          },
        },
        false,
        'resetMainForm'
      ),

    updateServiceFormField: (field, value) =>
      set(
        (state) => {
          const updatedServiceForm = {
            ...state.serviceForm,
            [field]: value,
          };

          if (field === 'quantity') {
            const parsedValue = parseInt(value, 10);
            if (!isNaN(parsedValue) && parsedValue > 0) {
              updatedServiceForm[field] = parsedValue;
            } else if (value === '' || value === null) {
              updatedServiceForm[field] = '';
            }
          }

          // recalculate finalPrice if price or discount changes
          const price = parseFloat(updatedServiceForm.price) || 0;

          // properly handle 0 discount (100% off)
          let discountFactor;
          if (
            updatedServiceForm.discount === undefined ||
            updatedServiceForm.discount === null ||
            updatedServiceForm.discount === ''
          ) {
            discountFactor = 1; // default to no discount
          } else {
            discountFactor = parseFloat(updatedServiceForm.discount);
            if (isNaN(discountFactor)) {
              discountFactor = 1; // fallback to no discount for invalid values
            }
          }

          updatedServiceForm.finalPrice = price * discountFactor;

          return {
            serviceForm: updatedServiceForm,
          };
        },
        false,
        `updateServiceFormField/${field}`
      ),

    // selectService function (keeping for backward compatibility)
    selectService: (service) => {
      set((state) => {
        const servicePrice = parseFloat(service.service_price || service.originalPrice || 0);

        const updatedServiceForm = {
          ...state.serviceForm,
          id: service.id,
          name: service.service_name || service.name || service.label,
          label: service.service_name || service.name || service.label,
          price: servicePrice,
          originalPrice: servicePrice, // store original price
          discount: state.serviceForm.discount || 1,
          quantity: state.serviceForm.quantity || 1,
          // additional service properties
          service_name: service.service_name || service.name || service.label,
          service_price: servicePrice,
          service_description: service.service_description,
          service_remarks: service.service_remarks,
          duration: parseInt(service.service_duration || service.duration || 45),
          service_duration: service.service_duration || service.duration,
          updated_at: service.updated_at,
          created_at: service.created_at,
          service_category_id: service.service_category_id,
          service_category_name: service.service_category_name,
          created_by_name: service.created_by_name,
          updated_by_name: service.updated_by_name,
        };

        console.log('Updated service form in store:', updatedServiceForm); // Debug log

        return {
          serviceForm: updatedServiceForm,
        };
      });
    },

    // get enabled service by ID
    getEnabledServiceById: async (serviceId) => {
      set({ isLoading: true, error: null }, false, `getEnabledServiceById/${serviceId}/pending`);

      try {
        const response = await api.get(`/service/enabled-id/${serviceId}`);
        const serviceData = response.data;

        // console.log('Enabled service data:', serviceData);

        set({ isLoading: false }, false, `getEnabledServiceById/${serviceId}/fulfilled`);

        return serviceData;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch enabled service';
        set({ error: errorMessage, isLoading: false }, false, `getEnabledServiceById/${serviceId}/rejected`);
        console.error('Error fetching enabled service:', error);
        throw error;
      }
    },

    resetServiceForm: () =>
      set(
        {
          serviceForm: {
            id: '',
            name: '',
            quantity: 1,
            price: 0,
            discount: 1, // factor
            finalPrice: 0, // 0 * 0 = 0
          },
        },
        false,
        'resetServiceForm'
      ),

    addServiceToPackage: () => {
      const currentServiceForm = get().serviceForm;

      if (!currentServiceForm.id && !currentServiceForm.name) {
        console.warn('Cannot add an empty or incomplete service. Please select a service and specify details.');
        return;
      }
      if (currentServiceForm.quantity <= 0) {
        console.warn('Service quantity must be greater than 0.');
        return;
      }

      set(
        (state) => ({
          mainFormData: {
            ...state.mainFormData,
            services: [...state.mainFormData.services, { ...currentServiceForm }],
          },
          serviceForm: {
            id: '',
            name: '',
            quantity: 1,
            price: 0,
            discount: 0,
            finalPrice: 0,
          },
        }),
        false,
        'addServiceToPackage'
      );
    },

    removeServiceFromPackage: (serviceIndexToRemove) => {
      set(
        (state) => ({
          mainFormData: {
            ...state.mainFormData,
            services: state.mainFormData.services.filter((_, index) => index !== serviceIndexToRemove),
          },
        }),
        false,
        `removeServiceFromPackage/${serviceIndexToRemove}`
      );
    },

    updateServiceInPackage: (index, updatedServiceDataFromComponent) => {
      set(
        (state) => {
          const newServices = [...state.mainFormData.services];
          if (newServices[index]) {
            const oldService = newServices[index];
            const mergedData = { ...oldService, ...updatedServiceDataFromComponent };

            const price = parseFloat(mergedData.price) || 0;

            // properly handle 0 discount (100% off)
            let discountFactor;
            if (mergedData.discount === undefined || mergedData.discount === null || mergedData.discount === '') {
              discountFactor = 1; // default to no discount
            } else {
              discountFactor = parseFloat(mergedData.discount);
              if (isNaN(discountFactor)) {
                discountFactor = 1; // fallback to no discount for invalid values
              }
            }

            newServices[index] = {
              ...mergedData,
              finalPrice: price * discountFactor,
            };
          }
          return {
            mainFormData: {
              ...state.mainFormData,
              services: newServices,
            },
          };
        },
        false,
        `updateServiceInPackage/${index}`
      );
    },

    fetchServiceOptions: async () => {
      set({ isLoading: true, error: null }, false, 'fetchServiceOptions/pending');
      try {
        const response = await api.get('/service/dropdown');

        const transformedOptions = response.data.map((service) => ({
          id: service.id,
          label: service.service_name,
          name: service.service_name,
          price: parseFloat(service.service_price) || 0,
          originalPrice: parseFloat(service.service_price) || 0,
        }));

        // console.log('Transformed service options:', transformedOptions);

        set({ serviceOptions: transformedOptions, isLoading: false }, false, 'fetchServiceOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchServiceOptions/rejected');
        console.error('Error fetching service options:', error);
      }
    },

    submitPackage: async (packageData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/cp/c', packageData);
        set({ isLoading: false });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create package';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },
  }))
);
