import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const calculateOverallPackagePrice = (services) =>
  services.reduce((total, service) => total + (service.finalPrice || 0) * (service.quantity || 0), 0);

export const useMcpFormStore = create(
  devtools((set, get) => ({
    mainFormData: {
      package_name: '',
      member_id: '',
      employee_id: '',
      package_remarks: '',
      package_price: 0, // SUM(service.finalPrice * service.quantity)
      services: [],
    },
    serviceForm: {
      id: '',
      name: '',
      quantity: 1,
      price: 0,
      finalPrice: 0, // price * discount
      discount: 1,
    },
    employeeOptions: [],
    serviceOptions: [],
    packageOptions: [],
    isCustomizable: true, // Default to true, can be overridden by selected package
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
          isCustomizable: true, // Reset to default customizable state
          serviceForm: {
            id: '',
            name: '',
            quantity: 1,
            price: 0,
            discount: 1,
            finalPrice: 0,
          },
        },
        false,
        'resetMainForm'
      ),

    // ==============================================================================================================
    // Employee
    // ==============================================================================================================

    fetchEmployeeOptions: async () => {
      set({ isLoading: true, error: null }, false, 'fetchEmployeeOptions/pending');
      try {
        const response = await api('/em/dropdown');
        const formattedOptions = response.data.map((emp) => ({
          id: emp.id,
          label: emp.employee_name,
        }));
        set({ employeeOptions: formattedOptions, isLoading: false }, false, 'fetchEmployeeOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchEmployeeOptions/rejected');
        console.error('Error fetching employee options:', error);
      }
    },

    // ==============================================================================================================
    // Services
    // ==============================================================================================================

    updateServiceFormField: (field, value) => {
      if (!get().isCustomizable && (field === 'price' || field === 'discount' || field === 'quantity')) {
        console.warn('Package is not customizable. Cannot update service form field:', field);
        return;
      }
      set(
        (state) => {
          const updatedServiceForm = {
            ...state.serviceForm,
            [field]: value,
          };

          const price = parseFloat(updatedServiceForm.price) || 0;
          const discountFactor = parseFloat(updatedServiceForm.discount) || 0;
          updatedServiceForm.finalPrice = price * discountFactor;

          return {
            serviceForm: updatedServiceForm,
          };
        },
        false,
        `updateServiceFormField/${field}`
      );
    },

    selectService: async (service) => {
      if (!get().isCustomizable && get().mainFormData.package_name !== '') {
        console.warn('Package is not customizable. Cannot select a new service.');
        return;
      }
      set({ isLoading: true, error: null }, false, 'selectService/pending');
      try {
        const response = await api.get('/service/' + service.id);
        const serviceData = response.data;

        const newPrice = parseFloat(serviceData.service_price) || 0;
        const newDiscountFactor = 1; // Default discount for a newly selected service

        set(
          {
            serviceForm: {
              id: serviceData.id,
              name: serviceData.service_name || 'Unnamed Service',
              price: newPrice,
              quantity: 1,
              discount: newDiscountFactor,
              finalPrice: newPrice * newDiscountFactor,
            },
            isLoading: false,
          },
          false,
          `selectService/fulfilled/${serviceData.id}`
        );
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'selectService/rejected');
        console.error('Error fetching service details:', error);
      }
    },

    addServiceToPackage: () => {
      if (!get().isCustomizable) {
        console.warn('Package is not customizable. Cannot add service.');
        return;
      }
      const currentServiceForm = get().serviceForm;

      if (!currentServiceForm.id || !currentServiceForm.name) {
        console.warn('Cannot add an empty or incomplete service. Please select a service and specify details.');
        return;
      }
      if (currentServiceForm.quantity <= 0) {
        console.warn('Service quantity must be greater than 0.');
        return;
      }

      set(
        (state) => {
          const newServices = [...state.mainFormData.services, { ...currentServiceForm }];
          const newPackagePrice = calculateOverallPackagePrice(newServices);
          return {
            mainFormData: {
              ...state.mainFormData,
              services: newServices,
              package_price: newPackagePrice,
            },
            serviceForm: {
              // Reset service form
              id: '',
              name: '',
              quantity: 1,
              price: 0,
              discount: 1,
              finalPrice: 0,
            },
          };
        },
        false,
        'addServiceToPackage'
      );
    },

    removeServiceFromPackage: (serviceIndexToRemove) => {
      if (!get().isCustomizable) {
        console.warn('Package is not customizable. Cannot remove service.');
        return;
      }
      set(
        (state) => {
          const newServices = state.mainFormData.services.filter((_, index) => index !== serviceIndexToRemove);
          const newPackagePrice = calculateOverallPackagePrice(newServices);
          return {
            mainFormData: {
              ...state.mainFormData,
              services: newServices,
              package_price: newPackagePrice,
            },
          };
        },
        false,
        `removeServiceFromPackage/${serviceIndexToRemove}`
      );
    },

    updateServiceInPackage: (index, updatedServiceDataFromComponent) => {
      if (!get().isCustomizable) {
        console.warn('Package is not customizable. Cannot update service.');
        return;
      }
      set(
        (state) => {
          const newServices = [...state.mainFormData.services];
          if (newServices[index]) {
            const oldService = newServices[index];
            const mergedData = { ...oldService, ...updatedServiceDataFromComponent };

            const price = parseFloat(mergedData.price) || 0;
            const discountFactor = parseFloat(mergedData.discount) || 0;
            const quantity = parseInt(mergedData.quantity, 10) || 0;

            newServices[index] = {
              ...mergedData,
              quantity: quantity,
              finalPrice: price * discountFactor,
            };
            const newPackagePrice = calculateOverallPackagePrice(newServices);
            return {
              mainFormData: {
                ...state.mainFormData,
                services: newServices,
                package_price: newPackagePrice,
              },
            };
          }
          return {}; // No change if index is out of bounds
        },
        false,
        `updateServiceInPackage/${index}`
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
            discount: 1,
            finalPrice: 0,
          },
        },
        false,
        'resetServiceForm'
      ),

    fetchServiceOptions: async () => {
      set({ isLoading: true, error: null }, false, 'fetchServiceOptions/pending');
      try {
        const response = await api('/service/dropdown');
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
    // ==============================================================================================================
    // Packages
    // ==============================================================================================================

    selectCarePackage: async (pkg) => {
      set({ isLoading: true, error: null }, false, 'selectCarePackage/pending');
      try {
        // Ensure service options are available.
        if (get().serviceOptions.length === 0) {
          await get().fetchServiceOptions(); // Await the fetch
        }
        const currentServiceOptions = get().serviceOptions;

        const response = await api.get('/cp/pkg/' + pkg.id);
        const data = response.data;

        const newServices = (data.details || []).map((s) => {
          const serviceOption = currentServiceOptions.find((f) => f.id == s.service_id);
          const price = parseFloat(s.care_package_item_details_price) || 0;
          const discount = parseFloat(s.care_package_item_details_discount) || 1; // Default discount to 1 if not provided
          // The API provides final price directly as care_package_item_details_price
          // and discount separately. The original price would be final_price / discount.
          const originalPrice = discount !== 0 ? price / discount : price;

          return {
            id: s.service_id,
            name: serviceOption?.label || 'Unknown Service',
            quantity: parseInt(s.care_package_item_details_quantity, 10) || 1,
            price: originalPrice,
            discount: discount,
            finalPrice: price, // This is the price per unit after discount from the backend
          };
        });

        const packagePrice = calculateOverallPackagePrice(newServices);

        set(
          {
            mainFormData: {
              ...get().mainFormData, // Preserve other fields like member_id, employee_id
              package_name: data.package?.care_package_name || '',
              package_remarks: data.package?.care_package_remarks || '',
              services: newServices, // Replace existing services
              package_price: packagePrice,
            },
            isCustomizable: data.package?.care_package_customizable ?? true,
            serviceForm: {
              // Reset service form when a package is selected
              id: '',
              name: '',
              quantity: 1,
              price: 0,
              discount: 1,
              finalPrice: 0,
            },
          },
          false,
          'selectCarePackage/fulfilled'
        );
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'selectCarePackage/rejected');
        console.error('Error selecting care package:', error);
      }
    },

    fetchCarePackageOptions: async () => {
      set({ isLoading: true, error: null }, false, 'fetchCarePackageOptions/pending');
      try {
        const response = await api('cp/dropdown');

        // Add null checking and filtering
        const formattedOptions = (response.data || [])
          .filter((pkg) => pkg && pkg.id && pkg.care_package_name) // Filter out null/invalid entries
          .map((pkg) => ({
            id: pkg.id,
            label: pkg.care_package_name,
            value: pkg.id, // Add value field for consistency
          }));

        console.log('Formatted care package options:', formattedOptions);
        set({ packageOptions: formattedOptions, isLoading: false }, false, 'fetchCarePackageOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchCarePackageOptions/rejected');
        console.error('Error fetching care package options:', error);
      }
    },
  }))
);
