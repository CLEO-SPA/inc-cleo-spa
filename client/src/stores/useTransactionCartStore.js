// stores/transactionCartStore.js
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

const useTransactionCartStore = create(
    devtools(
        subscribeWithSelector((set, get) => ({
            selectedMember: null,
            cartItems: [],
            currentStep: 'selection',

            setSelectedMember: (member) => set({ selectedMember: member }),

            addCartItem: (item) => set((state) => {
                const isTransfer = item.type === 'transfer';
                const data = {
                    ...item,
                    id: isTransfer ? 'transfer-auto' : Date.now(),
                    paymentMethod: null,
                    status: 'pending',
                };

                const existingIndex = state.cartItems.findIndex(i => i.id === data.id);
                const updatedCart = [...state.cartItems];

                if (existingIndex !== -1) {
                    updatedCart[existingIndex] = data;
                } else {
                    updatedCart.push(data);
                }

                return { cartItems: updatedCart };
            }),

            updateCartItem: (id, updates) => set((state) => ({
                cartItems: state.cartItems.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                )
            })),

            removeCartItem: (id) => set((state) => ({
                cartItems: state.cartItems.filter(item => item.id !== id)
            })),

            setCurrentStep: (step) => set({ currentStep: step }),

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
                        case 'transfer':
                            return total + (item.data.amount || 0);
                        default:
                            return total;
                    }
                }, 0);
            },

            clearCart: () => set({
                cartItems: [],
                selectedMember: null,
                currentStep: 'selection',
            }),

            getItemsByType: (type) => {
                const state = get();
                return state.cartItems.filter(item => item.type === type);
            }
        })),
        { name: 'transaction-cart-store' }
    )
);

export default useTransactionCartStore;
