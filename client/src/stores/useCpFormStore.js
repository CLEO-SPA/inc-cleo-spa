import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

export const useCpFormStore = create(
  devtools((set, get) => ({
    mainFormData: {
      package_name: '',
      package_remarks: '',
      package_price: 0,
      services: [],
    },
    serviceForm: {
      id: '',
      name: '',
      quantity: 1,
      price: 0,
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
            services: [],
          },
        },
        false,
        'resetMainForm'
      ),

    updateServiceFormField: (field, value) =>
      set(
        (state) => ({
          serviceForm: {
            ...state.serviceForm,
            [field]: value,
          },
        }),
        false,
        `updateServiceFormField/${field}`
      ),

    selectService: (serviceData) => {
      set(
        {
          serviceForm: {
            ...get().serviceForm,
            id: serviceData.id || serviceData.value,
            name: serviceData.name || serviceData.label,
            price: serviceData.price || 0,
            quantity: 1,
            discount: 0,
          },
        },
        false,
        `selectService/${serviceData.id || serviceData.value}`
      );
    },

    resetServiceForm: () =>
      set(
        {
          serviceForm: {
            id: '',
            name: '',
            quantity: 1,
            price: 0,
            discount: 0,
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

    updateServiceInPackage: (index, updatedServiceData) => {
      set(
        (state) => {
          const newServices = [...state.mainFormData.services];
          if (newServices[index]) {
            newServices[index] = { ...newServices[index], ...updatedServiceData };
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
        const response = await api('/services/all');
        const formattedOptions = response.data.map((service) => ({
          value: service.id,
          label: service.name,
          price: service.price,
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
