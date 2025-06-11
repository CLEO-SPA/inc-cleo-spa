import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

const useMemberVoucherFormStore = create(
  devtools((set, get) => ({
    // Form-specific state
    bypassTemplate: false,
    selectedTemplate: null,
    memberVoucherDetails: [],
    formData: {
      voucher_name: '',
      created_by: '',
      remarks: '',
      member_voucher_name: '',
      starting_balance: 0,
      free_of_charge: 0,
      total_price: 0,
    },
    
    // Actions
    setBypassTemplate: (bypass) => set({ 
      bypassTemplate: bypass,
      selectedTemplate: bypass ? null : get().selectedTemplate,
      memberVoucherDetails: bypass ? get().memberVoucherDetails : []
    }),
    
    setSelectedTemplate: (template) => {
      set({ selectedTemplate: template });
      if (template) {
        set((state) => ({
          formData: {
            ...state.formData,
            starting_balance: template.default_starting_balance || 0,
            free_of_charge: template.default_free_of_charge || 0,
            total_price: template.default_total_price || 0,
          }
        }));
      }
    },
    
    setFormData: (data) => set((state) => ({
      formData: { ...state.formData, ...data }
    })),
    
    addMemberVoucherDetail: () => set((state) => ({
      memberVoucherDetails: [...state.memberVoucherDetails, {
        id: Date.now(),
        service_id: '',
        name: '',
        price: 0,
        discount: 0,
        duration: '',
        final_price: 0
      }]
    })),
    
    updateMemberVoucherDetail: (id, field, value) => set((state) => ({
      memberVoucherDetails: state.memberVoucherDetails.map(detail => {
        if (detail.id === id) {
          const updated = { ...detail, [field]: value };
          if (field === 'price' || field === 'discount') {
            const price = field === 'price' ? value : updated.price;
            const discount = field === 'discount' ? value : updated.discount;
            updated.final_price = price - (price * discount / 100);
          }
          return updated;
        }
        return detail;
      })
    })),
    
    removeMemberVoucherDetail: (id) => set((state) => ({
      memberVoucherDetails: state.memberVoucherDetails.filter(detail => detail.id !== id)
    })),
    
    // Build final voucher data for cart
    buildVoucherData: () => {
      const state = get();
      return {
        ...state.formData,
        bypass_template: state.bypassTemplate,
        selected_template: state.selectedTemplate,
        member_voucher_details: state.memberVoucherDetails,
        created_at: new Date().toISOString(),
      };
    },
    
    // Add to cart and reset form
    addToCart: () => {
      const voucherData = get().buildVoucherData();
      const cartStore = useTransactionCartStore.getState();
      
      cartStore.addCartItem({
        type: 'member-voucher',
        data: voucherData
      });
      
      // Reset form
      set({
        bypassTemplate: false,
        selectedTemplate: null,
        memberVoucherDetails: [],
        formData: {
          voucher_name: '',
          created_by: '',
          remarks: '',
          member_voucher_name: '',
          starting_balance: 0,
          free_of_charge: 0,
          total_price: 0,
        }
      });
    },
    
    reset: () => set({
      bypassTemplate: false,
      selectedTemplate: null,
      memberVoucherDetails: [],
      formData: {
        voucher_name: '',
        created_by: '',
        remarks: '',
        member_voucher_name: '',
        starting_balance: 0,
        free_of_charge: 0,
        total_price: 0,
      }
    })
  }), { name: 'member-voucher-form-store' })
)

export default useMemberVoucherFormStore