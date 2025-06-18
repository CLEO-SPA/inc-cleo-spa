// stores/transactionCartStore.js - Main cart store
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

const useTransactionCartStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Selected member for the entire transaction
      selectedMember: null,
      
      // Cart items - different transaction types
      cartItems: [],
      
      // Current page/step
      currentStep: 'selection', // 'selection', 'payment', 'confirmation'
      
      // Actions
      setSelectedMember: (member) => set({ selectedMember: member }),
      
      addCartItem: (item) => set((state) => ({
        cartItems: [...state.cartItems, {
          id: Date.now(),
          type: item.type, // 'member-voucher', 'product', 'service', 'package', 'transfer'
          data: item.data,
          paymentMethod: null, // Will be set in payment step
          status: 'pending'
        }]
      })),
      
      updateCartItem: (id, updates) => set((state) => ({
        cartItems: state.cartItems.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      
      removeCartItem: (id) => set((state) => ({
        cartItems: state.cartItems.filter(item => item.id !== id)
      })),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Calculate totals
      getCartTotal: () => {
        const state = get();
        return state.cartItems.reduce((total, item) => {
          switch (item.type) {
            case 'member-voucher':
              return total + (item.data.total_price || 0);
            case 'product':
              return total + (item.data.price * item.data.quantity || 0);
            case 'service':
              return total + (item.data.price || 0);
            default:
              return total;
          }
        }, 0);
      },
      
      // Clear cart
      clearCart: () => set({
        cartItems: [],
        selectedMember: null,
        currentStep: 'selection'
      }),
      
      // Get items by type
      getItemsByType: (type) => {
        const state = get();
        return state.cartItems.filter(item => item.type === type);
      }
    })),
    { name: 'transaction-cart-store' }
  )
)

export default useTransactionCartStore;