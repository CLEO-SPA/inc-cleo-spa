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
    },
    serviceForm: {
      id: '',
      name: '',
      quantity: 1,
      price: 0,
      finalPrice: 0, // price * discount
      discount: 0,
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

          // Recalculate finalPrice if price or discount changes
          const price = parseFloat(updatedServiceForm.price) || 0;
          const discountFactor = parseFloat(updatedServiceForm.discount) || 0;

          updatedServiceForm.finalPrice = price * discountFactor;

          return {
            serviceForm: updatedServiceForm,
          };
        },
        false,
        `updateServiceFormField/${field}`
      ),

    selectService: async (service) => {
      try {
        const response = await api.get('/service/' + service.id);

        const serviceData = response.data;
        // console.log(serviceData);

        const newPrice = parseFloat(serviceData.service_price) || 0;
        const newDiscountFactor = 1;

        set(
          {
            serviceForm: {
              id: serviceData.id,
              name: serviceData.service_name,
              price: newPrice,
              quantity: 1, // Default quantity
              discount: newDiscountFactor, // Default discount factor
              finalPrice: newPrice * newDiscountFactor, // Calculated final unit price
            },
          },
          false,
          `selectService/${serviceData.id}`
        );
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchServiceDetails/rejected');
        console.error('Error fetching service details:', error);
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
            discount: 0, // Factor
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
            // Merge old data with new data from component
            const mergedData = { ...oldService, ...updatedServiceDataFromComponent };

            // Recalculate finalPrice for the updated service in the list
            const price = parseFloat(mergedData.price) || 0;
            const discountFactor = parseFloat(mergedData.discount) || 0;

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
        const response = await api('/service/dropdown');
        // console.log(response);

        const formattedOptions = response.data.map((service) => ({
          id: service.id,
          label: service.service_name,
        }));
        set({ serviceOptions: formattedOptions, isLoading: false }, false, 'fetchServiceOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchServiceOptions/rejected');
        console.error('Error fetching service options:', error);
      }
    },
  }))
);