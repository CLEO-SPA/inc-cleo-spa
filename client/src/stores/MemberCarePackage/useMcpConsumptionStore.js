import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

export const useConsumptionStore = create(
  devtools((set, get) => ({
    formData: {
      mcp_id: '',
      mcp_details: [],
      employee_id: '',
    },
    detailForm: {
      mcpd_id: '', // ID of the member_care_package_detail to consume
      service_name: '', // Name of the service for display
      mcpd_quantity: -1,
      mcpd_date: new Date().toISOString().split('T')[0], // Default to today
      max_quantity: 0, // Max consumable quantity for the selected service
    },
    currentPackageInfo: null, // stores { package: {...}, details: [{..., remaining_quantity: X}], transactionLogs: [...] }
    isLoading: false,
    error: null,
    isConfirming: false,
    isSubmitting: false,

    setIsConfirming: (isConfirming) => set({ isConfirming }, false, 'setIsConfirming'),

    updateMainField: (field, value) =>
      set(
        (state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
        }),
        false,
        `updateMainField/${field}`
      ),

    resetMainForm: () =>
      set(
        (state) => ({
          formData: {
            ...state.formData,
            mcp_details: [],
          },
          detailForm: {
            mcpd_id: '',
            service_name: '',
            mcpd_quantity: -1,
            mcpd_date: new Date().toISOString().split('T')[0],
            max_quantity: 0,
          },
          error: null,
        }),
        false,
        'resetMainFormAndDetailForm'
      ),

    updateDetailFormField: (field, value) =>
      set(
        (state) => {
          let parsedValue = value;
          if (field === 'mcpd_quantity') {
            // Allow user to type the negative sign
            if (value === '-') {
              return { detailForm: { ...state.detailForm, [field]: '-' } };
            }
            parsedValue = parseInt(value, 10);
            // Reset to -1 if input is invalid or not negative
            if (isNaN(parsedValue) || parsedValue >= 0) {
              parsedValue = -1;
            }
          }
          return {
            detailForm: {
              ...state.detailForm,
              [field]: parsedValue,
            },
          };
        },
        false,
        `updateDetailFormField/${field}`
      ),

    fetchPackageData: async (packageId) => {
      set({ isLoading: true, error: null, currentPackageInfo: null }, false, 'fetchPackageData/pending');
      try {
        const response = await api(`mcp/pkg/${packageId}`);
        const rawData = response.data;

        console.log(rawData);

        // Calculate remaining_quantity for each detail
        const processedDetails = rawData.details.map((detail) => {
          const consumedQuantity =
            rawData.transactionLogs?.filter(
              (log) => log.type === 'CONSUMPTION' && log.member_care_package_details_id === detail.id
            ).length || 0;

          return {
            ...detail,
            remaining_quantity: detail.quantity - consumedQuantity,
          };
        });

        set(
          (state) => ({
            currentPackageInfo: {
              ...rawData,
              details: processedDetails,
            },
            formData: {
              ...state.formData,
              mcp_id: rawData.package.id,
            },
            isLoading: false,
          }),
          false,
          'fetchPackageData/fulfilled'
        );
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        set({ error: errorMessage, isLoading: false }, false, 'fetchPackageData/rejected');
        console.error('Error fetching package data:', error);
      }
    },

    selectServiceToConsume: (serviceDetailId) => {
      const { currentPackageInfo } = get();
      if (!currentPackageInfo || !currentPackageInfo.details) return;

      const selectedService = currentPackageInfo.details.find((detail) => detail.id == serviceDetailId);

      // console.log(selectedService);

      if (selectedService) {
        set(
          (state) => ({
            detailForm: {
              ...state.detailForm,
              mcpd_id: selectedService.id,
              service_name: selectedService.service_name,
              max_quantity: selectedService.remaining_quantity,
              mcpd_quantity: -1,
            },
          }),
          false,
          'selectServiceToConsume'
        );
      }
    },

    addServiceToMcpDetails: () => {
      set(
        (state) => {
          const { detailForm, formData } = state;
          if (!detailForm.mcpd_id || Math.abs(detailForm.mcpd_quantity) <= 0) {
            console.warn('Cannot add service to details: missing mcpd_id or quantity is zero.');
            return {}; // No state change
          }

          const newDetail = {
            mcpd_id: detailForm.mcpd_id,
            mcpd_quantity: Math.abs(detailForm.mcpd_quantity),
            mcpd_date: detailForm.mcpd_date,
          };

          // The current UI supports one consumption at a time, so we replace the array.
          const newMcpDetails = [newDetail];

          return {
            formData: {
              ...formData,
              mcp_details: newMcpDetails,
            },
          };
        },
        false,
        'addServiceToMcpDetails'
      );
    },

    confirmConsumption: () => {
      const { detailForm, currentPackageInfo } = get();

      if (detailForm.mcpd_quantity >= 0) {
        set({ error: 'Quantity must be a negative number.' }, false, 'confirmConsumption/validationError');
        return;
      }
      if (Math.abs(detailForm.mcpd_quantity) > detailForm.max_quantity) {
        set(
          { error: `Quantity cannot exceed remaining ${detailForm.max_quantity}.` },
          false,
          'confirmConsumption/validationError'
        );
        return;
      }

      // Balance validation
      if (currentPackageInfo?.package && currentPackageInfo?.details) {
        const selectedService = currentPackageInfo.details.find((d) => d.id === detailForm.mcpd_id);
        if (selectedService) {
          const sessionPrice = selectedService.price * selectedService.discount;
          const totalConsumptionCost = sessionPrice * Math.abs(detailForm.mcpd_quantity);
          const currentBalance = currentPackageInfo.package.balance;

          if (currentBalance < totalConsumptionCost) {
            set(
              {
                error: `Insufficient balance. Needs $${totalConsumptionCost.toFixed(
                  2
                )}, but only $${currentBalance.toFixed(2)} is available.`,
              },
              false,
              'confirmConsumption/balanceError'
            );
            return;
          }
        }
      }

      // Stage the service details for submission
      get().addServiceToMcpDetails();
      set({ isConfirming: true, error: null }, false, 'confirmConsumption');
    },

    submitConsumption: async () => {
      const { formData, currentPackageInfo } = get();

      if (!formData.mcp_id || formData.mcp_details.length === 0 || !formData.employee_id) {
        set(
          { error: 'Missing required fields: Package ID, Service Details, or Employee ID.' },
          false,
          'submitConsumption/validationError'
        );
        return;
      }

      set({ isSubmitting: true, error: null, isConfirming: false }, false, 'submitConsumption/pending');

      const payload = {
        mcp_id: formData.mcp_id,
        employee_id: formData.employee_id,
        mcp_details: formData.mcp_details,
      };

      console.log(payload);

      try {
        const result = await api.post('/mcp/consume', payload);
        console.log(result);

        set(
          {
            isSubmitting: false,
          },
          false,
          'submitConsumption/fulfilled'
        );
        if (currentPackageInfo && currentPackageInfo.package && currentPackageInfo.package.id) {
          get().fetchPackageData(currentPackageInfo.package.id);
        }
        set(
          (state) => ({
            formData: {
              ...state.formData,
              mcp_details: [],
            },
            detailForm: {
              ...state.detailForm,
              mcpd_id: '',
              service_name: '',
              mcpd_quantity: -1,
              max_quantity: 0,
            },
          }),
          false,
          'resetFormsAfterConsumption'
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'An unknown error occurred during consumption.';
        set({ error: errorMessage, isSubmitting: false }, false, 'submitConsumption/rejected');
        console.error('Error submitting consumption:', error);
      }
    },
  }))
);
