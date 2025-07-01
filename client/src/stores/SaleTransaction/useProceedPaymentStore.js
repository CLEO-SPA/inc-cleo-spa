import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useProceedPaymentStore = create(
  devtools(
    (set, get) => ({
      // State
      transaction: null,
      receiptNumber: '',
      loading: false,
      error: null,
      processing: false,
      
      // Payment state
      newPayments: [],
      selectedPaymentMethod: '',
      paymentHandlerId: '',
      transactionHandlerId: '', // NEW: For the transaction handler
      generalRemark: '',
      createdAt: '', // RESTORED: For custom creation date
      
      // Constants
      PENDING_PAYMENT_METHOD_ID: 7,
      
      // Actions
      setTransaction: (transaction) => {
        console.log('Store: Setting transaction:', transaction);
        // Auto-set transaction handler if available from transaction data
        const transactionHandler = transaction?.handler?.code || '';
        set({ 
          transaction,
          transactionHandlerId: transactionHandler // Auto-populate from transaction
        });
      },
      setReceiptNumber: (receiptNumber) => {
  console.log('Store: Setting receipt number:', receiptNumber);
  set({ receiptNumber: receiptNumber });
},

// Update setTransaction to auto-populate receipt number:
setTransaction: (transaction) => {
  console.log('Store: Setting transaction:', transaction);
  const transactionHandler = transaction?.handler?.code || '';
  set({ 
    transaction,
    transactionHandlerId: transactionHandler,
    receiptNumber: transaction?.receipt_no || '' // NEW: Auto-populate receipt number
  });
},
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setProcessing: (processing) => set({ processing }),
      
      setSelectedPaymentMethod: (methodId) => {
        console.log('Store: Setting selected payment method:', methodId, typeof methodId);
        set({ selectedPaymentMethod: methodId });
      },
      
      setPaymentHandlerId: (handlerId) => {
        console.log('Store: Setting payment handler:', handlerId);
        set({ paymentHandlerId: handlerId });
      },
      
      setTransactionHandlerId: (handlerId) => {
        console.log('Store: Setting transaction handler:', handlerId);
        set({ transactionHandlerId: handlerId });
      },
      
      setCreatedAt: (dateTime) => {
        console.log('Store: Setting created at:', dateTime);
        set({ createdAt: dateTime });
      },
      
      setGeneralRemark: (remark) => set({ generalRemark: remark }),
      
      // Payment management
      addPayment: (payment) => {
        const { newPayments } = get();
        console.log('Store: Adding payment:', payment);
        console.log('Store: Current payments before add:', newPayments);
        
        const updatedPayments = [...newPayments, payment];
        console.log('Store: Updated payments after add:', updatedPayments);
        
        set({ 
          newPayments: updatedPayments,
          selectedPaymentMethod: '' // Reset selection after adding
        });
      },
      
      removePayment: (paymentId) => {
        const { newPayments } = get();
        console.log('Store: Removing payment with ID:', paymentId);
        
        const updatedPayments = newPayments.filter(p => p.id !== paymentId);
        console.log('Store: Updated payments after remove:', updatedPayments);
        
        set({ newPayments: updatedPayments });
      },
      
      updatePaymentAmount: (paymentId, amount) => {
        const { newPayments } = get();
        console.log('Store: Updating payment amount:', { paymentId, amount });
        
        const updatedPayments = newPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, amount: parseFloat(amount) || 0 }
            : payment
        );
        
        console.log('Store: Updated payments after amount change:', updatedPayments);
        set({ newPayments: updatedPayments });
      },
      
      updatePaymentRemark: (paymentId, remark) => {
        const { newPayments } = get();
        console.log('Store: Updating payment remark:', { paymentId, remark });
        
        const updatedPayments = newPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, remark }
            : payment
        );
        
        set({ newPayments: updatedPayments });
      },
      
      // Calculated values
      getOutstandingAmount: () => {
        const { transaction } = get();
        if (!transaction) return 0;
        return parseFloat(transaction.outstanding_total_payment_amount || 0);
      },
      
      getNewPaymentsTotal: () => {
        const { newPayments } = get();
        return newPayments.reduce((total, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return total + amount;
        }, 0);
      },
      
      getRemainingOutstanding: () => {
        const { getOutstandingAmount, getNewPaymentsTotal } = get();
        return getOutstandingAmount() - getNewPaymentsTotal();
      },
      
      getUpdatedPendingAmount: () => {
        const { getRemainingOutstanding } = get();
        const remaining = getRemainingOutstanding();
        return Math.max(0, remaining);
      },
      
      // Validation
      isValidForProcessing: () => {
        const { paymentHandlerId, transactionHandlerId, newPayments, createdAt } = get();
        
        if (!paymentHandlerId) {
          return { valid: false, message: 'Please select a payment handler' };
        }
        
        if (!transactionHandlerId) {
          return { valid: false, message: 'Please select a transaction handler' };
        }
        
        if (!createdAt) {
          return { valid: false, message: 'Please set creation date and time' };
        }
        
        if (newPayments.length === 0) {
          return { valid: false, message: 'Please add at least one payment method' };
        }
        
        const invalidPayments = newPayments.filter(p => !p.amount || parseFloat(p.amount) <= 0);
        if (invalidPayments.length > 0) {
          return { valid: false, message: 'Please enter valid amounts for all payment methods' };
        }
        
        return { valid: true };
      },
      
      // Reset store
reset: () => {
  console.log('Store: Resetting payment store');
  set({
    transaction: null,
    loading: false,
    error: null,
    processing: false,
    newPayments: [],
    selectedPaymentMethod: '',
    paymentHandlerId: '',
    transactionHandlerId: '',
    generalRemark: '',
    receiptNumber: '', // NEW: Reset receipt number
    createdAt: new Date().toISOString().slice(0, 16)
  });
},
      
      // Clear payments only
      clearPayments: () => {
        console.log('Store: Clearing payments');
        set({
          newPayments: [],
          selectedPaymentMethod: '',
          generalRemark: ''
        });
      }
    }),
    {
      name: 'proceed-payment-store', // Store name for devtools
    }
  )
);

export default useProceedPaymentStore;