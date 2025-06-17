import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const useMemberVoucherFormStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Form-specific state
      bypassTemplate: false,
      selectedTemplate: null,
      memberVoucherDetails: [],
      formData: {
        voucher_template_id: '',
        created_by: '',
        creation_datetime: '',
        remarks: '',
        member_voucher_name: '',
        starting_balance: 0,
        free_of_charge: 0,
        total_price: 0,
        status: 'active',
        member_voucher_details: [],
      },
      formErrors: {},

      // Form validation
      validateForm: () => {
        const state = get();
        const errors = {};

        if (state.bypassTemplate && !state.formData.member_voucher_name?.trim()) {
          errors.member_voucher_name = 'Member voucher name is required';
        }

        if (state.bypassTemplate && (!state.formData.starting_balance || state.formData.starting_balance <= 0)) {
          errors.starting_balance = 'Starting balance is required and must be greater than 0';
        }

        if (!state.formData.creation_datetime) {
          errors.creation_datetime = 'Creation datetime is required';
        }

        if (!state.formData.created_by) {
          errors.created_by = 'Created by is required';
        }

        set({ formErrors: errors });
        return Object.keys(errors).length === 0;
      },

      // Actions
      setBypassTemplate: (bypass) => {
        set((state) => {
          const newFormData = { ...state.formData };
          const newMemberVoucherDetails = [];

          if (bypass) {
            // Reset template-related fields when bypassing
            newFormData.voucher_template_id = '';
            newFormData.starting_balance = 0;
            newFormData.free_of_charge = 0;
            newFormData.total_price = 0;
            newFormData.member_voucher_name = '';
            newFormData.member_voucher_details = [];
          }

          return {
            bypassTemplate: bypass,
            selectedTemplate: bypass ? null : state.selectedTemplate,
            formData: newFormData,
            memberVoucherDetails: newMemberVoucherDetails,
            formErrors: {}, // Clear errors on toggle
          };
        });
      },

      setSelectedTemplate: (template) => {
        set((state) => {
          if (!template) {
            return {
              selectedTemplate: null,
              formData: {
                ...state.formData,
                voucher_template_id: '',
                starting_balance: 0,
                free_of_charge: 0,
                total_price: 0,
                remarks: '',
                member_voucher_details: [],
              },
              memberVoucherDetails: [],
            };
          }

          const memberVoucherDetailsFromTemplate = template.details
            ? template.details.map((detail) => ({
                id: detail.id || Date.now() + Math.random(),
                service_id: Number(detail.service_id) || '',
                name: detail.service_name_from_service || detail.service_name || '',
                price: parseFloat(detail.original_price) || 0,
                custom_price: parseFloat(detail.custom_price) || 0,
                discount: parseFloat(detail.discount) || 0,
                final_price: parseFloat(detail.final_price) || 0,
                duration: detail.duration || 0,
              }))
            : [];

          return {
            selectedTemplate: template,
            formData: {
              ...state.formData,
              voucher_template_id: template.id,
              member_voucher_name: template.voucher_template_name || '',
              starting_balance: parseFloat(template.default_starting_balance) ?? 0,
              free_of_charge: parseFloat(template.default_free_of_charge) ?? 0,
              total_price: parseFloat(template.default_total_price) ?? 0,
              remarks: template.remarks ?? '',
              status: template.status ?? 'active',
              created_by: template.created_by ?? state.formData.created_by,
              created_at: template.created_at ?? null,
              member_voucher_details: memberVoucherDetailsFromTemplate,
            },
            memberVoucherDetails: memberVoucherDetailsFromTemplate,
          };
        });
      },

      // Update form field
      updateFormField: (field, value) => {
        set((state) => {
          const newFormData = { ...state.formData, [field]: value };
          
          // Auto-calculate total price if in bypass mode
          if (state.bypassTemplate && (field === 'starting_balance' || field === 'free_of_charge')) {
            const startingBalance = field === 'starting_balance' ? parseFloat(value) || 0 : state.formData.starting_balance;
            const freeOfCharge = field === 'free_of_charge' ? parseFloat(value) || 0 : state.formData.free_of_charge;
            newFormData.total_price = Math.max(0, startingBalance - freeOfCharge);
          }

          return {
            formData: newFormData,
            // Clear specific field error when user starts typing
            formErrors: {
              ...state.formErrors,
              [field]: undefined,
            },
          };
        });
      },

      // Member voucher details management
      addMemberVoucherDetail: (newDetail = {}) => {
        set((state) => {
          const detail = {
            id: Date.now() + Math.random(),
            service_id: '',
            name: '',
            price: 0,
            discount: 0,
            duration: '',
            final_price: 0,
            ...newDetail,
          };

          return {
            memberVoucherDetails: [...state.memberVoucherDetails, detail],
            formData: {
              ...state.formData,
              member_voucher_details: [...state.memberVoucherDetails, detail],
            },
          };
        });
      },

      updateMemberVoucherDetail: (id, field, value) => {
        set((state) => {
          const updatedDetails = state.memberVoucherDetails.map((detail) => {
            if (detail.id === id) {
              const updated = { ...detail, [field]: value };

              // Recalculate final_price if price or discount changes
              if (field === 'price' || field === 'discount') {
                const price = field === 'price' ? parseFloat(value) || 0 : parseFloat(updated.price);
                const discount = field === 'discount' ? parseFloat(value) || 0 : parseFloat(updated.discount);
                updated.final_price = price - (price * (discount / 100));
              }
              return updated;
            }
            return detail;
          });

          return {
            memberVoucherDetails: updatedDetails,
            formData: {
              ...state.formData,
              member_voucher_details: updatedDetails,
            },
          };
        });
      },

      removeMemberVoucherDetail: (id) => {
        set((state) => {
          const filteredDetails = state.memberVoucherDetails.filter((detail) => detail.id !== id);
          
          return {
            memberVoucherDetails: filteredDetails,
            formData: {
              ...state.formData,
              member_voucher_details: filteredDetails,
            },
          };
        });
      },

      // Handle service selection for member voucher details
      handleServiceSelect: (detailId, serviceDetails) => {
        set((state) => {
          const updatedDetails = state.memberVoucherDetails.map((detail) => {
            if (detail.id === detailId) {
              const finalPrice = (serviceDetails.service_price || 0) -
                ((serviceDetails.service_price || 0) * (detail.discount || 0) / 100);
              
              return {
                ...detail,
                service_id: serviceDetails.id,
                name: serviceDetails.service_name,
                price: serviceDetails.service_price || 0,
                duration: serviceDetails.service_duration || '',
                final_price: finalPrice,
              };
            }
            return detail;
          });

          return {
            memberVoucherDetails: updatedDetails,
            formData: {
              ...state.formData,
              member_voucher_details: updatedDetails,
            },
          };
        });
      },

      // Handle price change with final price calculation
      handlePriceChange: (detailId, price) => {
        get().updateMemberVoucherDetail(detailId, 'price', price);
      },

      // Handle discount change with final price calculation
      handleDiscountChange: (detailId, discount) => {
        get().updateMemberVoucherDetail(detailId, 'discount', discount);
      },

      // Template selection handler
      handleTemplateSelect: (templateDetails) => {
        if (!templateDetails) {
          console.log('No template provided');
          return;
        }

        get().setSelectedTemplate(templateDetails);
      },

      // Form submission
      submitForm: () => {
        const state = get();
        const cartStore = useTransactionCartStore.getState();

        // Validate form
        if (!get().validateForm()) {
          return false;
        }

        // Check if member is selected
        if (!cartStore.selectedMember) {
          alert('Please select a member first');
          return false;
        }

        // Build voucher data
        const voucherData = {
          ...state.formData,
          bypass_template: state.bypassTemplate,
          selected_template: state.selectedTemplate,
          member_voucher_details: state.memberVoucherDetails,
          created_at: new Date().toISOString(),
        };

        // Add to cart
        cartStore.addCartItem({
          type: 'member-voucher',
          data: voucherData,
        });

        // Reset form
        get().reset();
        console.log('Member voucher form submitted successfully:', voucherData);
        return true;
      },

      // Reset form
      reset: () => {
        set({
          bypassTemplate: false,
          selectedTemplate: null,
          memberVoucherDetails: [],
          formData: {
            voucher_template_id: '',
            created_by: '',
            creation_datetime: '',
            remarks: '',
            member_voucher_name: '',
            starting_balance: 0,
            free_of_charge: 0,
            total_price: 0,
            status: 'active',
            member_voucher_details: [],
          },
          formErrors: {},
        });
      },

      // Get form field value
      getFormValue: (field) => {
        return get().formData[field];
      },

      // Get form error
      getFormError: (field) => {
        return get().formErrors[field];
      },

      // Check if form has errors
      hasFormErrors: () => {
        const errors = get().formErrors;
        return Object.keys(errors).some(key => errors[key]);
      },

      // Auto-set creation datetime to current datetime
      setCurrentDateTime: () => {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        get().updateFormField('creation_datetime', localDateTime);
      },
    })),
    { name: 'member-voucher-form-store' }
  )
);

export default useMemberVoucherFormStore;