// stores/transactionCartStore.js - Main cart store
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { useMcpFormStore } from './MemberCarePackage/useMcpFormStore';

const useTransactionCartStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Selected member for the entire transaction
      selectedMember: null,

      // Cart items - different transaction types
      cartItems: [],

      // Current page/step
      currentStep: 'selection', 

      // Actions
      setSelectedMember: (member) => {
        console.log('👤 Setting selected member:', member);
        set({ selectedMember: member });
      },

      addCartItem: (item) => {
        console.log('📦 Adding item to cart:', {
          type: item.type,
          data: item.data,
          id: item.id || Date.now(),
        });


        if (item.type === 'member-voucher') {
          console.log('🎟️ Member Voucher Details:', {
            name: item.data?.member_voucher_name,
            totalPrice: item.data?.total_price,
            startingBalance: item.data?.starting_balance,
            freeOfCharge: item.data?.free_of_charge,
            createdBy: item.data?.created_by, 
            handledBy: item.data?.handled_by,
            hasDetails:
              Array.isArray(item.data?.member_voucher_details) &&
              item.data?.member_voucher_details.length > 0,
          });
          

          console.log('Using created_by from voucher directly:', item.data?.created_by);
        }


        if (item.type === 'package') {
          console.log('📦 Care Package Details:', {
            name: item.data?.name,
            price: item.data?.price,
            employeeId: item.data?.employee_id, 
          });
        }

        const newItem = {
          id: item.id || Date.now(),
          type: item.type, 
          data: item.data,
          paymentMethod: null, 
          status: 'pending',
        };

        set((state) => ({
          cartItems: [...state.cartItems, newItem],
        }));

        // Log cart after addition
        setTimeout(() => {
          const updatedCart = get().cartItems;
          console.log(`🛒 Cart now has ${updatedCart.length} items`);
        }, 0);
      },

      updateCartItem: (id, updates) => {
        console.log(`🔄 Updating cart item ${id}:`, updates);

        set((state) => ({
          cartItems: state.cartItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        }));
      },

      removeCartItem: (id) => {
        console.log(`🗑️ Removing item ${id} from cart`);

        const itemToRemove = get().cartItems.find((item) => item.id === id);

        if (itemToRemove && itemToRemove.type === 'package') {
          console.log('📦 Removing package from MCP creation queue:', id);
          useMcpFormStore.getState().removeMcpFromCreationQueue(id);
        }

        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== id),
        }));

        // Log cart after removal
        setTimeout(() => {
          const updatedCart = get().cartItems;
          console.log(`🛒 Cart now has ${updatedCart.length} items`);
        }, 0);
      },

      setCurrentStep: (step) => {
        console.log(`🔄 Setting current step to: ${step}`);
        set({ currentStep: step });
      },

      // Calculate totals
      getCartTotal: () => {
        const state = get();
        const total = state.cartItems.reduce((total, item) => {
          let itemTotal = 0;

          switch (item.type) {
            case 'member-voucher':
              itemTotal = item.data?.total_price || 0;
              break;
            case 'product':
              itemTotal = (item.data?.price || 0) * (item.data?.quantity || 1);
              break;
            case 'service':
            case 'package':
              itemTotal = item.data?.price || 0;
              break;
            default:
              itemTotal = 0;
          }

          return total + itemTotal;
        }, 0);

        console.log(`💰 Cart total calculated: $${total.toFixed(2)}`);
        return total;
      },

      // Clear cart
      clearCart: () => {
        console.log('🧹 Clearing cart and resetting state');

        set({
          cartItems: [],
          selectedMember: null,
          currentStep: 'selection',
        });
      },

      // Get items by type
      getItemsByType: (type) => {
        const state = get();
        const items = state.cartItems.filter((item) => item.type === type);
        console.log(`🔍 Getting items of type ${type}:`, items.length);
        return items;
      },

      // Debug function to log all cart items
      debugCart: () => {
        const state = get();
        console.group('🛒 Current Cart State');
        console.log('Selected Member:', state.selectedMember);
        console.log('Current Step:', state.currentStep);
        console.log('Cart Items:', state.cartItems);

        // Group items by type for easier debugging
        const itemsByType = {};
        state.cartItems.forEach((item) => {
          if (!itemsByType[item.type]) {
            itemsByType[item.type] = [];
          }
          itemsByType[item.type].push(item);
        });

        console.log('Items by Type:', itemsByType);
        console.log('Total Value:', get().getCartTotal());
        console.groupEnd();
      },
    })),
    { name: 'transaction-cart-store' }
  )
);

export default useTransactionCartStore;