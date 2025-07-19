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
      GST_PAYMENT_METHOD_ID: 10, // ✅ NEW: Add GST constant
      
      // Actions
      setTransaction: (transaction) => {
        console.log('Store: Setting transaction:', transaction);
        // Auto-set transaction handler if available from transaction data
        const transactionHandler = transaction?.handler?.code || '';
        set({ 
          transaction,
          transactionHandlerId: transactionHandler, // Auto-populate from transaction
          receiptNumber: transaction?.receipt_no || '' // NEW: Auto-populate receipt number
        });
      },
      
      setReceiptNumber: (receiptNumber) => {
        console.log('Store: Setting receipt number:', receiptNumber);
        set({ receiptNumber: receiptNumber });
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
      
      // ✅ FIXED: Calculate total payments using CORRECT backend logic
      getNewPaymentsTotal: () => {
        const { newPayments, PENDING_PAYMENT_METHOD_ID, GST_PAYMENT_METHOD_ID } = get();
        
        // Separate payments by type (same as backend)
        const actualPayments = newPayments.filter(payment => 
          payment.methodId !== PENDING_PAYMENT_METHOD_ID.toString() &&
          payment.methodId !== GST_PAYMENT_METHOD_ID.toString()
        );
        
        const gstPayments = newPayments.filter(payment => 
          payment.methodId === GST_PAYMENT_METHOD_ID.toString()
        );
        
        const totalActualPaymentAmount = actualPayments.reduce((total, payment) => 
          total + (parseFloat(payment.amount) || 0), 0
        );
        
        const totalGSTAmount = gstPayments.reduce((total, payment) => 
          total + (parseFloat(payment.amount) || 0), 0
        );
        
        // Total paid = actual + GST (excludes pending) - same as backend
        const totalPaid = totalActualPaymentAmount + totalGSTAmount;
        
        console.log('✅ Store getNewPaymentsTotal (matches backend):', {
          totalActualPaymentAmount,
          totalGSTAmount,
          totalPaid,
          note: 'Excludes pending payments'
        });
        
        return totalPaid;
      },
      
      // ✅ FIXED: Calculate remaining outstanding using CORRECT backend logic
      getRemainingOutstanding: () => {
        const { newPayments, getOutstandingAmount, PENDING_PAYMENT_METHOD_ID, GST_PAYMENT_METHOD_ID } = get();
        
        // Only actual payments reduce outstanding (same as backend)
        const actualPayments = newPayments.filter(payment => 
          payment.methodId !== PENDING_PAYMENT_METHOD_ID.toString() &&
          payment.methodId !== GST_PAYMENT_METHOD_ID.toString()
        );
        
        const totalActualPaymentAmount = actualPayments.reduce((total, payment) => 
          total + (parseFloat(payment.amount) || 0), 0
        );
        
        // Calculate remaining outstanding (backend authority) - same as backend
        const remainingOutstanding = Math.max(0, getOutstandingAmount() - totalActualPaymentAmount);
        
        console.log('✅ Store getRemainingOutstanding (matches backend):', {
          originalOutstanding: getOutstandingAmount(),
          totalActualPaymentAmount,
          remainingOutstanding,
          note: 'Only actual payments reduce outstanding, GST excluded'
        });
        
        return remainingOutstanding;
      },
      
      // ✅ FIXED: Updated pending amount calculation using backend logic
      getUpdatedPendingAmount: () => {
        const { getRemainingOutstanding } = get();
        // This is what backend will create as pending payment
        const pendingAmount = getRemainingOutstanding();
        
        console.log('✅ Store getUpdatedPendingAmount (matches backend):', {
          pendingAmount,
          note: 'This is what backend will auto-create'
        });
        
        return pendingAmount;
      },
      
      // ✅ NEW: Get payment breakdown for UI display
      getPaymentBreakdown: () => {
        const { newPayments, getOutstandingAmount, PENDING_PAYMENT_METHOD_ID, GST_PAYMENT_METHOD_ID } = get();
        
        // Separate payments by type (same as backend)
        const actualPayments = newPayments.filter(payment => 
          payment.methodId !== PENDING_PAYMENT_METHOD_ID.toString() &&
          payment.methodId !== GST_PAYMENT_METHOD_ID.toString()
        );
        
        const gstPayments = newPayments.filter(payment => 
          payment.methodId === GST_PAYMENT_METHOD_ID.toString()
        );
        
        // Calculate amounts (same logic as backend)
        const totalActualPaymentAmount = actualPayments.reduce((total, payment) => 
          total + (parseFloat(payment.amount) || 0), 0
        );
        
        const totalGSTAmount = gstPayments.reduce((total, payment) => 
          total + (parseFloat(payment.amount) || 0), 0
        );
        
        // Calculate correct outstanding amount (backend authority) - same as backend
        const outstandingReduction = totalActualPaymentAmount; // Only actual payments reduce outstanding
        const newOutstandingAmount = Math.max(0, getOutstandingAmount() - outstandingReduction);
        
        // Total paid amount = actual payments + GST (EXCLUDES pending) - same as backend
        const totalPaidAmount = totalActualPaymentAmount + totalGSTAmount;
        
        return {
          actualPayments,
          gstPayments,
          totalActualPaymentAmount,
          totalGSTAmount,
          outstandingReduction,
          newOutstandingAmount,
          totalPaidAmount,
          willCreatePending: newOutstandingAmount > 0
        };
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
        
        // ✅ FIXED: Only validate non-GST payments for amount validation
        const nonGSTPayments = newPayments.filter(p => !p.isGST && !p.methodName?.includes('GST'));
        const invalidPayments = nonGSTPayments.filter(p => !p.amount || parseFloat(p.amount) <= 0);
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