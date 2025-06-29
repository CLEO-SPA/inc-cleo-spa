import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format, parseISO } from 'date-fns';
import api from '@/services/api';

const calculateOverallPackagePrice = (services) =>
  services.reduce((total, service) => total + (service.finalPrice || 0) * (service.quantity || 0), 0);

// Date utility functions
const toLocalDateTimeString = (dateValue) => {
  try {
    if (!dateValue) {
      dateValue = new Date();
    }

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

    if (isNaN(date.getTime())) {
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }

    // Simple format for datetime-local input (YYYY-MM-DDTHH:MM)
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting date:', error);
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }
};

const fromLocalDateTimeString = (localDateTimeString) => {
  try {
    if (!localDateTimeString) {
      return new Date().toISOString();
    }

    const localDate = parseISO(localDateTimeString);

    if (isNaN(localDate.getTime())) {
      return new Date().toISOString();
    }

    return localDate.toISOString();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date().toISOString();
  }
};

export const useMcpFormStore = create(
  devtools((set, get) => ({
    mainFormData: {
      package_name: '',
      member_id: '',
      employee_id: '',
      package_remarks: '',
      package_price: 0, // SUM(service.finalPrice * service.quantity)
      services: [],
      created_at: new Date(),
      updated_at: new Date(),
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
    memberCarePackageOptions: [],
    isCustomizable: true,
    isLoading: false,
    error: null,
    mcpCreationQueue: [],
    mcpTransferQueue: [],

    toLocalDateTimeString,
    fromLocalDateTimeString,

    setBypassMode: (isBypass) => set({ isByPass: isBypass, isCustomizable: true }, false, 'setBypassMode'),

    updateMainField: (field, value) => {
      // Handle date fields specially
      if (field === 'created_at' || field === 'updated_at') {
        // If it's a datetime-local string, convert it to ISO
        if (typeof value === 'string' && value.includes('T')) {
          value = fromLocalDateTimeString(value);
        }
      }

      set(
        (state) => ({
          mainFormData: {
            ...state.mainFormData,
            [field]: value,
          },
        }),
        false,
        `updateMainField/${field}`
      );
    },

    // Helper method to get formatted date for datetime-local inputs
    getFormattedDate: (field) => {
      const dateValue = get().mainFormData[field];
      return toLocalDateTimeString(dateValue);
    },

    // Helper method to update date fields from datetime-local inputs
    updateDateField: (field, localDateTimeString) => {
      try {
        const isoString = fromLocalDateTimeString(localDateTimeString);
        set(
          (state) => ({
            mainFormData: {
              ...state.mainFormData,
              [field]: isoString,
              // Auto-update updated_at when created_at changes
              ...(field === 'created_at' && { updated_at: isoString }),
            },
          }),
          false,
          `updateDateField/${field}`
        );
      } catch (error) {
        console.error('Error updating date field:', error);
      }
    },

    resetMainForm: () =>
      set(
        {
          mainFormData: {
            package_name: '',
            package_remarks: '',
            package_price: 0,
            services: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          isCustomizable: true, // Reset to default customizable state
          isByPass: false,
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
      if (
        !get().isCustomizable &&
        !get().isByPass && // Fixed: changed from isBypass to isByPass
        (field === 'price' || field === 'discount' || field === 'quantity')
      ) {
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
      if (!get().isCustomizable && !get().isByPass && get().mainFormData.package_name !== '') {
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
      if (!get().isCustomizable && !get().isByPass) {
        console.warn('Package is not customizable. Cannot add service.');
        return;
      }
      const currentServiceForm = get().serviceForm;
      const isBypass = get().isByPass; // Fixed: changed from isBypass to isByPass

      if (!currentServiceForm.name) {
        console.warn('Cannot add an empty or incomplete service. Please specify service name.');
        return;
      }

      // In bypass mode, we don't need a service ID, but in normal mode we do
      if (!isBypass && !currentServiceForm.id) {
        console.warn('Cannot add service without selecting from existing services.');
        return;
      }

      if (currentServiceForm.quantity <= 0) {
        console.warn('Service quantity must be greater than 0.');
        return;
      }

      set(
        (state) => {
          const serviceToAdd = {
            ...currentServiceForm,
            // Set ID to 0 for bypass mode (custom services)
            id: state.isByPass ? 0 : currentServiceForm.id, // Fixed: changed from isBypass to isByPass
          };

          const newServices = [...state.mainFormData.services, serviceToAdd];
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
        if (get().serviceOptions.length === 0) {
          await get().fetchServiceOptions();
        }
        const currentServiceOptions = get().serviceOptions;

        const response = await api.get('/cp/pkg/' + pkg.id);
        const data = response.data;

        const newServices = (data.details || []).map((s) => {
          const serviceOption = currentServiceOptions.find((f) => f.id == s.service_id);
          const price = parseFloat(s.care_package_item_details_price) || 0;
          const discount = parseFloat(s.care_package_item_details_discount) || 1;
          const finalPrice = discount !== 0 ? price * discount : price;

          return {
            id: s.service_id,
            name: serviceOption?.label || 'Unknown Service',
            quantity: parseInt(s.care_package_item_details_quantity, 10) || 1,
            price: price,
            discount: discount,
            finalPrice: finalPrice,
          };
        });

        const packagePrice = calculateOverallPackagePrice(newServices);

        set(
          {
            mainFormData: {
              ...get().mainFormData,
              package_name: data.package?.care_package_name || '',
              package_remarks: data.package?.care_package_remarks || '',
              services: newServices,
              package_price: packagePrice,
            },
            isCustomizable: data.package?.care_package_customizable ?? true,
            serviceForm: {
              id: '',
              name: '',
              quantity: 1,
              price: 0,
              discount: 1,
              finalPrice: 0,
            },
            isLoading: false,
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

        const formattedOptions = (response.data || [])
          .filter((pkg) => pkg && pkg.id && pkg.care_package_name)
          .map((pkg) => ({
            id: pkg.id,
            label: pkg.care_package_name,
            value: pkg.id,
          }));

        set({ packageOptions: formattedOptions, isLoading: false }, false, 'fetchCarePackageOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchCarePackageOptions/rejected');
        console.error('Error fetching care package options:', error);
      }
    },

    fetchMemberCarePackageOptionsByMember: async (memberId) => {
      set({ isLoading: true, error: null }, false, 'fetchMemberCarePackageOptions/pending');
      try {
        const response = await api('mcp/dropdown/' + memberId);

        const formattedOptions = (response.data || [])
          .filter((pkg) => pkg && pkg.id && pkg.package_name)
          .map((pkg) => ({
            value: pkg.id,
            label: `${pkg.package_name} ($${Number(pkg.balance).toFixed(2)})`,
            balance: Number(pkg.balance),
          }));

        set(
          { memberCarePackageOptions: formattedOptions, isLoading: false },
          false,
          'fetchMemberCarePackageOptions/fulfilled'
        );
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchMemberCarePackageOptions/rejected');
        console.error('Error fetching member care package options:', error);
      }
    },

    voidMemberCarePackage: async (packageId) => {
      set({ isLoading: true, error: null }, false, 'VoidMemberCarePackageOptions/pending');
      try {
        await api.delete('/mcp/void/' + packageId);

        set({ isLoading: false }, false, 'voidMemberCarePackageOptions/fulfilled');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'voidMemberCarePackageOptions/rejected');
        console.error('Error voiding member care package options:', error);
        throw error;
      }
    },

    updateMemberCarePackageStatus: async (packageId, servicesPayload) => {
      set({ isLoading: true, error: null }, false, 'updateMemberCarePackageStatus/pending');
      try {
        const response = await api.put('/mcp/u/s', {
          id: packageId,
          services: servicesPayload,
        });
        set({ isLoading: false }, false, 'updateMemberCarePackageStatus/fulfilled');
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'updateMemberCarePackageStatus/rejected');
        console.error('Error updating member care package status:', error);
        throw error;
      }
    },

    addMcpToTransferQueue: (transferData) => {
      const { mcp_id1, mcp_id2, newDestinationData, amount } = transferData;
      const queue = get().mcpTransferQueue;
      const memberCarePackageOptions = get().memberCarePackageOptions;

      const sourcePackage = memberCarePackageOptions.find((opt) => opt.value === mcp_id1);
      if (!sourcePackage) {
        const errorMessage = `Source MCP with ID ${mcp_id1} not found in options.`;
        set({ error: errorMessage });
        return null;
      }
      const sourceBalance = sourcePackage.balance;

      const alreadyQueuedAmount = queue
        .filter((item) => item.mcp_id1 === mcp_id1)
        .reduce((sum, item) => sum + item.amount, 0);

      if (alreadyQueuedAmount + amount > sourceBalance) {
        const remainingBalance = sourceBalance - alreadyQueuedAmount;
        const errorMessage = `Transfer amount exceeds remaining balance for source MCP. Remaining: $${remainingBalance.toFixed(
          2
        )}.`;
        set({ error: errorMessage });
        return null;
      }

      const newItem = {
        id: `transfer-${Date.now()}`,
        mcp_id1,
        mcp_id2,
        newDestinationData,
        amount,
      };

      set(
        (state) => ({
          mcpTransferQueue: [...state.mcpTransferQueue, newItem],
          error: null,
        }),
        false,
        'addMcpToTransferQueue'
      );

      console.log('In Queue', get().mcpTransferQueue);
      return newItem;
    },

    removeMcpFromTransferQueue: (transferId) => {
      set(
        (state) => ({
          mcpTransferQueue: state.mcpTransferQueue.filter((mcp) => mcp.id !== transferId),
        }),
        false,
        `removeMcpFromTransferQueue/${transferId}`
      );

      console.log('In Queue', get().mcpTransferQueue);
    },

    processMcpTransferQueue: async () => {
      const queue = get().mcpTransferQueue;
      if (queue.length === 0) {
        return { success: true, results: [], packages: [] };
      }

      set({ isLoading: true, error: null }, false, 'processMcpTransferQueue/pending');

      try {
        const newPackagesToCreate = queue
          .filter((item) => item.newDestinationData)
          .map((item) => ({ ...item.newDestinationData, tempId: item.id }));

        let createdPackagesMap = {};

        if (newPackagesToCreate.length > 0) {
          // eslint-disable-next-line no-unused-vars
          const creationPayload = newPackagesToCreate.map(({ tempId, ...rest }) => rest);
          const creationResponse = await api.post('/mcp/create', { packages: creationPayload });

          const createdPackages = creationResponse.data.createdPackages;
          createdPackagesMap = newPackagesToCreate.reduce((acc, item, index) => {
            if (createdPackages[index]?.memberCarePackageId) {
              acc[item.tempId] = createdPackages[index].memberCarePackageId;
            }
            return acc;
          }, {});
        }

        const transferPayload = queue.map((item) => {
          const destinationId = item.newDestinationData ? createdPackagesMap[item.id] : item.mcp_id2;

          if (!destinationId) {
            throw new Error(`Could not resolve destination ID for transfer from ${item.mcp_id1}`);
          }

          return {
            mcp_id1: item.mcp_id1,
            mcp_id2: destinationId,
            isNew: !!item.newDestinationData,
            amount: item.amount,
          };
        });

        console.log(transferPayload);

        const transferResponse = await api.post('/mcp/transfer', { packages: transferPayload });

        set({ isLoading: false, mcpTransferQueue: [] }, false, 'processMcpTransferQueue/fulfilled');
        return { success: true, results: transferResponse.data, packages: transferPayload };
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'An unknown error occurred during MCP transfer';
        set({ error: errorMessage, isLoading: false }, false, 'processMcpTransferQueue/rejected');
        console.error('Error processing MCP transfer queue:', error);
        return { success: false, error: errorMessage };
      }
    },

    clearMcpTransferQueue: () => {
      set({ mcpTransferQueue: [] }, false, 'clearMcpTransferQueue');
    },

    addMcpToCreationQueue: (packageData) => {
      set(
        (state) => ({
          mcpCreationQueue: [...state.mcpCreationQueue, packageData],
        }),
        false,
        'addMcpToCreationQueue'
      );

      console.log('In Queue', get().mcpCreationQueue);
    },

    removeMcpFromCreationQueue: (mcpId) => {
      set(
        (state) => ({
          mcpCreationQueue: state.mcpCreationQueue.filter((mcp) => mcp.id !== mcpId),
        }),
        false,
        `removeMcpFromCreationQueue/${mcpId}`
      );

      console.log('In Queue', get().mcpCreationQueue);
    },

    processMcpCreationQueue: async () => {
      const queue = get().mcpCreationQueue;
      if (queue.length === 0) {
        return { success: true, results: [] };
      }

      set({ isLoading: true, error: null }, false, 'processMcpCreationQueue/pending');
      try {
        const response = await api.post('/mcp/create', { packages: queue });
        set({ isLoading: false, mcpCreationQueue: [] }, false, 'processMcpCreationQueue/fulfilled');
        return { success: true, results: response.data };
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'An unknown error occurred during MCP creation';
        set({ error: errorMessage, isLoading: false }, false, 'processMcpCreationQueue/rejected');
        console.error('Error processing MCP creation queue:', error);
        return { success: false, error: errorMessage };
      }
    },

    clearMcpCreationQueue: () => {
      set({ mcpCreationQueue: [] }, false, 'clearMcpCreationQueue');
    },
  }))
);
