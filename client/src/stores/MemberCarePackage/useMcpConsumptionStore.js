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
      mcpd_quantity: 1,
      mcpd_date: new Date().toISOString().split('T')[0], // Default to today
      max_quantity: 0, // Max consumable quantity for the selected service
    },
    currentPackageInfo: null, // stores { package: {...}, details: [{..., remaining_quantity: X}], transactionLogs: [...] }
    isLoading: false,
    error: null,

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
            mcpd_quantity: 1,
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
            parsedValue = parseInt(value, 10);
            if (isNaN(parsedValue) || parsedValue < 1) parsedValue = 1;
            if (parsedValue > state.detailForm.max_quantity && state.detailForm.max_quantity > 0) {
              parsedValue = state.detailForm.max_quantity;
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

        // Calculate remaining_quantity for each detail
        const processedDetails = rawData.details.map((detail) => {
          const initialQuantity = detail.quantity;
          let consumedQuantity = 0;

          if (rawData.transactionLogs && Array.isArray(rawData.transactionLogs)) {
            rawData.transactionLogs.forEach((log) => {
              if (log.type === 'CONSUMPTION' && log.member_care_package_details_id === detail.id) {
                if (detail.price > 0) {
                  consumedQuantity += Math.abs(log.amount_changed / detail.price);
                } else {
                  consumedQuantity += Math.abs(log.amount_changed);
                }
              }
            });
          }
          consumedQuantity = Math.round(consumedQuantity);

          return {
            ...detail,
            remaining_quantity: initialQuantity - consumedQuantity,
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

      const selectedService = currentPackageInfo.details.find((detail) => detail.id === serviceDetailId);

      if (selectedService) {
        set(
          (state) => ({
            detailForm: {
              ...state.detailForm,
              mcpd_id: selectedService.id,
              service_name: selectedService.service_name,
              max_quantity: selectedService.remaining_quantity,
              mcpd_quantity: 1,
            },
          }),
          false,
          'selectServiceToConsume'
        );
      }
    },

    submitConsumption: async () => {
      const { detailForm, formData, currentPackageInfo } = get();

      if (!formData.mcp_id || !detailForm.mcpd_id || !formData.employee_id) {
        set(
          { error: 'Missing required fields: Package ID, Service Detail, or Employee ID.' },
          false,
          'submitConsumption/validationError'
        );
        return;
      }
      if (detailForm.mcpd_quantity <= 0) {
        set({ error: 'Quantity must be greater than 0.' }, false, 'submitConsumption/validationError');
        return;
      }
      if (detailForm.mcpd_quantity > detailForm.max_quantity) {
        set(
          { error: `Quantity cannot exceed remaining ${detailForm.max_quantity}.` },
          false,
          'submitConsumption/validationError'
        );
        return;
      }

      set({ isLoading: true, error: null }, false, 'submitConsumption/pending');

      const payload = {
        mcp_id: formData.mcp_id,
        employee_id: formData.employee_id,
        mcp_details: [
          {
            mcpd_id: detailForm.mcpd_id,
            mcpd_quantity: detailForm.mcpd_quantity,
            mcpd_date: detailForm.mcpd_date,
          },
        ],
      };

      try {
        await api.post('/mcp/consume', payload);
        set(
          {
            isLoading: false,
          },
          false,
          'submitConsumption/fulfilled'
        );
        if (currentPackageInfo && currentPackageInfo.package && currentPackageInfo.package.id) {
          get().fetchPackageData(currentPackageInfo.package.id);
        }
        set(
          (state) => ({
            detailForm: {
              ...state.detailForm,
              mcpd_id: '',
              service_name: '',
              mcpd_quantity: 1,
              max_quantity: 0,
            },
          }),
          false,
          'resetSelectedServiceAfterConsumption'
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'An unknown error occurred during consumption.';
        set({ error: errorMessage, isLoading: false }, false, 'submitConsumption/rejected');
        console.error('Error submitting consumption:', error);
      }
    },
  }))
);
