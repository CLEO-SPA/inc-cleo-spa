// stores/useSalesTransactionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const useSalesTransactionStore = create(
  devtools(
    (set, get) => ({
      // MEMBER STATE
      currentMember: null,
      memberCarePackages: [],
      memberVouchers: [],
      memberSearchLoading: false,
      memberCarePackagesLoading: false,
      memberVouchersLoading: false,
      
      // PAGINATION STATE FOR PACKAGES
      packagesCurrentPage: 1,
      packagesTotalPages: 0,
      packagesTotalItems: 0,
      packagesItemsPerPage: 3,
      packagesSearchTerm: '',
      
      // PAGINATION STATE FOR VOUCHERS
      vouchersCurrentPage: 1,
      vouchersTotalPages: 0,
      vouchersTotalItems: 0,
      vouchersItemsPerPage: 3,
      vouchersSearchTerm: '',

      // CART STATE
      cartItems: [],
      cartTotal: 0,
      cartTax: 0,
      cartDiscount: 0,
      cartSubtotal: 0,

      // SERVICES & PRODUCTS STATE
      availableServices: [],
      servicesLoading: false,
      availableProducts: [],
      productsLoading: false,

      // TRANSACTION STATE
      transactionLoading: false,
      paymentMethod: 'cash', // cash, card, package, voucher
      paymentAmount: 0,
      changeAmount: 0,

      // ERROR STATE
      error: null,

      // MEMBER ACTIONS
      searchMember: async (searchTerm) => {
        set({ memberSearchLoading: true, error: null });

        try {
          const response = await api.get('/member/search', {
            params: { q: searchTerm }
          });

          const data = response.data;

          if (data.members && data.members.length > 0) {
            const member = data.members[0];

            set({
              currentMember: member,
              memberSearchLoading: false,
              // Reset pagination when new member is selected
              packagesCurrentPage: 1,
              vouchersCurrentPage: 1,
              packagesSearchTerm: '',
              vouchersSearchTerm: ''
            });

            // Load initial data with default pagination
            await get().loadMemberPackages(member.id, 1, 3, '');
            await get().loadMemberVouchers(member.id, 1, 3, '');

            return member;
          } else {
            set({
              currentMember: null,
              memberCarePackages: [],
              memberVouchers: [],
              memberSearchLoading: false,
              packagesCurrentPage: 1,
              packagesTotalPages: 0,
              packagesTotalItems: 0,
              vouchersCurrentPage: 1,
              vouchersTotalPages: 0,
              vouchersTotalItems: 0,
              packagesSearchTerm: '',
              vouchersSearchTerm: ''
            });

            return null;
          }
        } catch (error) {
          set({
            error: error.message,
            memberSearchLoading: false,
            currentMember: null
          });
          throw error;
        }
      },

      loadMemberPackages: async (memberId, page = 1, limit = 3, searchTerm = '') => {
        set({ memberCarePackagesLoading: true });
        const offset = (page - 1) * limit;

        try {
          const response = await api.get(`/member/${memberId}/member-care-packages`, {
            params: { 
              offset, 
              limit,
              search: searchTerm 
            }
          });
          const data = response.data;

          set({
            memberCarePackages: data.carePackages || [],
            packagesCurrentPage: page,
            packagesTotalPages: Math.ceil((data.totalCount || 0) / limit),
            packagesTotalItems: data.totalCount || 0,
            packagesItemsPerPage: limit,
            packagesSearchTerm: searchTerm,
            memberCarePackagesLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            memberCarePackagesLoading: false
          });
        }
      },

      loadMemberVouchers: async (memberId, page = 1, limit = 3, searchTerm = '') => {
        set({ memberVouchersLoading: true });
        const offset = (page - 1) * limit;

        try {
          const response = await api.get(`/member/${memberId}/member-vouchers`, {
            params: { 
              offset, 
              limit,
              search: searchTerm 
            }
          });

          const data = response.data;

          set({
            memberVouchers: data.vouchers || [],
            vouchersCurrentPage: page,
            vouchersTotalPages: Math.ceil((data.totalCount || 0) / limit),
            vouchersTotalItems: data.totalCount || 0,
            vouchersItemsPerPage: limit,
            vouchersSearchTerm: searchTerm,
            memberVouchersLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            memberVouchersLoading: false
          });
        }
      },

      // PAGINATION ACTIONS FOR PACKAGES
      setPackagesPage: async (page) => {
        const { currentMember, packagesItemsPerPage, packagesSearchTerm } = get();
        if (currentMember) {
          await get().loadMemberPackages(currentMember.id, page, packagesItemsPerPage, packagesSearchTerm);
        }
      },

      setPackagesItemsPerPage: async (limit) => {
        const { currentMember, packagesSearchTerm } = get();
        if (currentMember) {
          await get().loadMemberPackages(currentMember.id, 1, limit, packagesSearchTerm);
        }
      },

      searchPackages: async (searchTerm) => {
        const { currentMember, packagesItemsPerPage } = get();
        if (currentMember) {
          await get().loadMemberPackages(currentMember.id, 1, packagesItemsPerPage, searchTerm);
        }
      },

      // PAGINATION ACTIONS FOR VOUCHERS
      setVouchersPage: async (page) => {
        const { currentMember, vouchersItemsPerPage, vouchersSearchTerm } = get();
        if (currentMember) {
          await get().loadMemberVouchers(currentMember.id, page, vouchersItemsPerPage, vouchersSearchTerm);
        }
      },

      setVouchersItemsPerPage: async (limit) => {
        const { currentMember, vouchersSearchTerm } = get();
        if (currentMember) {
          await get().loadMemberVouchers(currentMember.id, 1, limit, vouchersSearchTerm);
        }
      },

      searchVouchers: async (searchTerm) => {
        const { currentMember, vouchersItemsPerPage } = get();
        if (currentMember) {
          await get().loadMemberVouchers(currentMember.id, 1, vouchersItemsPerPage, searchTerm);
        }
      }
,

      // SERVICES & PRODUCTS ACTIONS
      loadAvailableServices: async () => {
        set({ servicesLoading: true });
        
        try {
          const services = await api.get('/services');
          set({ 
            availableServices: services,
            servicesLoading: false 
          });
        } catch (error) {
          set({ 
            error: error.message,
            servicesLoading: false 
          });
        }
      },

      loadAvailableProducts: async () => {
        set({ productsLoading: true });
        
        try {
          const products = await api.get('/products');
          set({ 
            availableProducts: products,
            productsLoading: false 
          });
        } catch (error) {
          set({ 
            error: error.message,
            productsLoading: false 
          });
        }
      },

      // CART ACTIONS
      addToCart: (item) => {
        const { cartItems } = get();
        
        // For regular services and products, check if item already exists and increment quantity
        if (item.type === 'service' || item.type === 'product') {
          const existingItemIndex = cartItems.findIndex(
            cartItem => cartItem.id === item.id && cartItem.type === item.type
          );

          let newCartItems;
          if (existingItemIndex >= 0) {
            // Update quantity if item already exists
            newCartItems = cartItems.map((cartItem, index) =>
              index === existingItemIndex
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            );
          } else {
            // Add new item with quantity 1
            newCartItems = [...cartItems, { ...item, quantity: 1 }];
          }
          
          set({ cartItems: newCartItems });
        } else {
          // For MCPs, vouchers, and transfers, always add as new item (no quantity combining)
          const newCartItems = [...cartItems, { ...item, quantity: 1 }];
          set({ cartItems: newCartItems });
        }

        get().calculateCartTotals();
      },

      removeFromCart: (itemId, itemType) => {
        const { cartItems } = get();
        const newCartItems = cartItems.filter(
          item => !(item.id === itemId && item.type === itemType)
        );
        
        set({ cartItems: newCartItems });
        get().calculateCartTotals();
      },

      updateCartItemQuantity: (itemId, itemType, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId, itemType);
          return;
        }

        const { cartItems } = get();
        const newCartItems = cartItems.map(item =>
          item.id === itemId && item.type === itemType
            ? { ...item, quantity }
            : item
        );

        set({ cartItems: newCartItems });
        get().calculateCartTotals();
      },

      calculateCartTotals: () => {
        const { cartItems } = get();
        
        const subtotal = cartItems.reduce(
          (total, item) => total + (item.price * item.quantity), 
          0
        );
        
        // Calculate tax (you can adjust tax rate as needed)
        const taxRate = 0.08; // 8% tax
        const tax = subtotal * taxRate;
        
        // Calculate discount (implement your discount logic)
        const discount = 0; // You can implement discount logic later
        
        const total = subtotal + tax - discount;

        set({
          cartSubtotal: subtotal,
          cartTax: tax,
          cartDiscount: discount,
          cartTotal: total
        });
      },

      clearCart: () => {
        set({
          cartItems: [],
          cartTotal: 0,
          cartTax: 0,
          cartDiscount: 0,
          cartSubtotal: 0
        });
      },

      // PAYMENT ACTIONS
      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },

      setPaymentAmount: (amount) => {
        const { cartTotal } = get();
        const change = Math.max(0, amount - cartTotal);
        set({ 
          paymentAmount: amount,
          changeAmount: change 
        });
      },

      // TRANSACTION ACTIONS
      processTransaction: async () => {
        const { 
          currentMember, 
          cartItems, 
          cartTotal, 
          paymentMethod, 
          paymentAmount 
        } = get();

        if (!currentMember) {
          throw new Error('No member selected');
        }

        if (cartItems.length === 0) {
          throw new Error('Cart is empty');
        }

        set({ transactionLoading: true });

        try {
          const result = await api.post('/transactions', {
            memberId: currentMember.id,
            items: cartItems,
            total: cartTotal,
            paymentMethod,
            paymentAmount,
            timestamp: new Date().toISOString()
          });
          
          // Clear cart and reset state after successful transaction
          get().clearCart();
          set({
            transactionLoading: false,
            paymentAmount: 0,
            changeAmount: 0
          });

          return result;
        } catch (error) {
          set({ 
            error: error.message,
            transactionLoading: false 
          });
          throw error;
        }
      },

      // VOUCHER & MCP MANAGEMENT ACTIONS
      createVoucher: async (voucherData) => {
        try {
          const result = await api.post('/vouchers', voucherData);
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      createMemberCarePackage: async (mcpData) => {
        try {
          const result = await api.post('/member-care-packages', mcpData);
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      transferVoucher: async (transferData) => {
        try {
          const result = await api.post('/vouchers/transfer', transferData);
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      transferMemberCarePackage: async (transferData) => {
        try {
          const result = await api.post('/member-care-packages/transfer', transferData);
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // FORM DATA STATE & ACTIONS
      formData: {
        voucher: {
          code: '',
          value: 0,
          expiryDate: '',
          description: ''
        },
        mcp: {
          packageName: '',
          totalSessions: 1,
          price: 0,
          expiryDate: ''
        },
        transferVoucher: {
          voucherId: '',
          toMemberId: '',
          reason: ''
        },
        transferMcp: {
          mcpId: '',
          toMemberId: '',
          reason: ''
        }
      },

      updateFormData: (formType, data) => {
        set(state => ({
          formData: {
            ...state.formData,
            [formType]: {
              ...state.formData[formType],
              ...data
            }
          }
        }));
      },

      resetFormData: (formType) => {
        const initialData = {
          voucher: { code: '', value: 0, expiryDate: '', description: '' },
          mcp: { packageName: '', totalSessions: 1, price: 0, expiryDate: '' },
          transferVoucher: { voucherId: '', toMemberId: '', reason: '' },
          transferMcp: { mcpId: '', toMemberId: '', reason: '' }
        };

        set(state => ({
          formData: {
            ...state.formData,
            [formType]: initialData[formType]
          }
        }));
      },

      // UTILITY ACTIONS
      clearError: () => {
        set({ error: null });
      },

      clearMember: () => {
        set({
          currentMember: null,
          memberCarePackages: [],
          memberVouchers: [],
          error: null
        });
      },

      resetTransaction: () => {
        get().clearCart();
        get().clearMember();
        set({
          paymentMethod: 'cash',
          paymentAmount: 0,
          changeAmount: 0,
          error: null
        });
      }
    }),
    {
      name: 'sales-transaction-store'
    }
  )
);

export default useSalesTransactionStore;