import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const getInitialState = () => ({
  // Transaction creation state
  isCreating: false,
  currentStep: 'idle', 
  createdTransactions: [],
  failedTransactions: [],
  
  // Transaction creation progress
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
    currentOperation: ''
  },

  // General transaction details (shared across all transactions)
  transactionDetails: {
    receiptNumber: '',
    transactionRemark: '',
    createdBy: null, 
    handledBy: null, 
    memberId: null,
    customerType: 'MEMBER' 
  },

  // Error handling
  errors: [],
  lastError: null,
});

const useSaleTransactionStore = create(
  devtools(
    (set, get) => ({
      ...getInitialState(),

      // Constants
      PENDING_PAYMENT_METHOD_ID: 7, // Based on your database structure

      // Helper function to calculate outstanding amount and add pending payment
      addAutoPendingPayment: (totalAmount, existingPayments) => {
        // Calculate total paid amount from existing payments
        const totalPaid = existingPayments.reduce((sum, payment) => {
          return sum + (payment.amount || 0);
        }, 0);

        // Calculate outstanding amount
        const outstandingAmount = totalAmount - totalPaid;

        // Check if there's already a pending payment
        const existingPendingPayment = existingPayments.find(
          payment => payment.methodId === get().PENDING_PAYMENT_METHOD_ID
        );

        let updatedPayments = [...existingPayments];

        if (outstandingAmount > 0) {
          if (existingPendingPayment) {
            // Update existing pending payment amount
            updatedPayments = updatedPayments.map(payment => 
              payment.methodId === get().PENDING_PAYMENT_METHOD_ID
                ? { ...payment, amount: outstandingAmount }
                : payment
            );
          } else {
            // Add new pending payment
            updatedPayments.push({
              id: Date.now() + Math.random(),
              methodId: get().PENDING_PAYMENT_METHOD_ID,
              methodName: 'Pending',
              amount: outstandingAmount,
              remark: 'Auto-generated pending payment for outstanding amount',
              isAutoPending: true
            });
          }
        } else if (outstandingAmount <= 0 && existingPendingPayment) {
          // Remove pending payment if outstanding amount is 0 or negative
          updatedPayments = updatedPayments.filter(
            payment => payment.methodId !== get().PENDING_PAYMENT_METHOD_ID || !payment.isAutoPending
          );
        }

        return updatedPayments;
      },

      // Update transaction details
      updateTransactionDetails: (details) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            ...details
          }
        }));
      },

      // Set receipt number
      setReceiptNumber: (receiptNumber) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            receiptNumber
          }
        }));
      },

      // Set transaction remark
      setTransactionRemark: (transactionRemark) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            transactionRemark
          }
        }));
      },

      // Set created by employee
      setCreatedBy: (createdBy) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            createdBy
          }
        }));
      },

      // Set handled by employee
      setHandledBy: (handledBy) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            handledBy
          }
        }));
      },

      // Set member info
      setMemberInfo: (member) => {
        set(state => ({
          transactionDetails: {
            ...state.transactionDetails,
            memberId: member?.id || null,
            customerType: member ? 'MEMBER' : 'WALK_IN'
          }
        }));
      },

      // Main orchestration function
      createSaleTransactions: async (transactionData) => {
        set({ 
          isCreating: true, 
          currentStep: 'preparing',
          createdTransactions: [],
          failedTransactions: [],
          errors: []
        });

        try {
          const { transactionDetails } = get();

          // Validate required transaction details
          if (!transactionDetails.createdBy) {
            throw new Error('Transaction creator (created_by) is required');
          }

          if (!transactionDetails.handledBy) {
            throw new Error('Transaction handler (handled_by) is required');
          }

          // Process transaction data and auto-add pending payments for MCP and MV
          const processedTransactionData = get().processTransactionDataWithPending(transactionData);

          // Calculate total number of transactions to create
          const servicesProductsCount = processedTransactionData.servicesProducts?.items?.length > 0 ? 1 : 0;
          const mcpCount = processedTransactionData.mcpTransactions?.length || 0;
          const mvCount = processedTransactionData.mvTransactions?.length || 0;
          const totalTransactions = servicesProductsCount + mcpCount + mvCount;

          console.log('📊 Transaction Summary:', {
            servicesProducts: servicesProductsCount,
            mcpTransactions: mcpCount,
            mvTransactions: mvCount,
            total: totalTransactions,
            transactionDetails
          });

          set({ 
            currentStep: 'creating',
            progress: { 
              total: totalTransactions, 
              completed: 0, 
              failed: 0,
              currentOperation: 'Starting transaction creation...'
            }
          });

          const createdTransactions = [];
          const failedTransactions = [];

          // 1. Create Services + Products transaction (if exists)
          if (processedTransactionData.servicesProducts?.items?.length > 0) {
            set(state => ({
              progress: { 
                ...state.progress, 
                currentOperation: 'Creating Services & Products transaction...' 
              }
            }));

            try {
              const servicesTransaction = await get().createServicesProductsTransaction(
                processedTransactionData.servicesProducts
              );
              
              createdTransactions.push({
                type: 'services-products',
                transaction: servicesTransaction,
                items: processedTransactionData.servicesProducts.items
              });

              set(state => ({
                progress: { 
                  ...state.progress, 
                  completed: state.progress.completed + 1 
                }
              }));

            } catch (error) {
              console.error('❌ Services/Products transaction failed:', error);
              failedTransactions.push({
                type: 'services-products',
                error: error.message,
                data: processedTransactionData.servicesProducts
              });
              
              set(state => ({
                progress: { 
                  ...state.progress, 
                  failed: state.progress.failed + 1 
                },
                errors: [...state.errors, `Services/Products: ${error.message}`]
              }));
            }
          }

          // 2. Create individual MCP transactions
          if (processedTransactionData.mcpTransactions?.length > 0) {
            for (let i = 0; i < processedTransactionData.mcpTransactions.length; i++) {
              const mcpData = processedTransactionData.mcpTransactions[i];
              
              set(state => ({
                progress: { 
                  ...state.progress, 
                  currentOperation: `Creating MCP transaction ${i + 1}/${processedTransactionData.mcpTransactions.length}...` 
                }
              }));

              try {
                const mcpTransaction = await get().createMcpTransaction(mcpData);
                
                createdTransactions.push({
                  type: 'mcp',
                  transaction: mcpTransaction,
                  item: mcpData.item
                });

                set(state => ({
                  progress: { 
                    ...state.progress, 
                    completed: state.progress.completed + 1 
                  }
                }));

              } catch (error) {
                console.error('❌ MCP transaction failed:', error);
                failedTransactions.push({
                  type: 'mcp',
                  error: error.message,
                  data: mcpData
                });
                
                set(state => ({
                  progress: { 
                    ...state.progress, 
                    failed: state.progress.failed + 1 
                  },
                  errors: [...state.errors, `MCP (${mcpData.item.data?.name}): ${error.message}`]
                }));
              }
            }
          }

          // 3. Create individual MV transactions
          if (processedTransactionData.mvTransactions?.length > 0) {
            for (let i = 0; i < processedTransactionData.mvTransactions.length; i++) {
              const mvData = processedTransactionData.mvTransactions[i];
              
              set(state => ({
                progress: { 
                  ...state.progress, 
                  currentOperation: `Creating MV transaction ${i + 1}/${processedTransactionData.mvTransactions.length}...` 
                }
              }));

              try {
                const mvTransaction = await get().createMvTransaction(mvData);
                
                createdTransactions.push({
                  type: 'mv',
                  transaction: mvTransaction,
                  item: mvData.item
                });

                set(state => ({
                  progress: { 
                    ...state.progress, 
                    completed: state.progress.completed + 1 
                  }
                }));

              } catch (error) {
                console.error('❌ MV transaction failed:', error);
                failedTransactions.push({
                  type: 'mv',
                  error: error.message,
                  data: mvData
                });
                
                set(state => ({
                  progress: { 
                    ...state.progress, 
                    failed: state.progress.failed + 1 
                  },
                  errors: [...state.errors, `MV (${mvData.item.data?.member_voucher_name}): ${error.message}`]
                }));
              }
            }
          }

          // Determine final state
          const hasFailures = failedTransactions.length > 0;
          const hasSuccesses = createdTransactions.length > 0;

          set({
            createdTransactions,
            failedTransactions,
            currentStep: hasFailures ? (hasSuccesses ? 'partial' : 'failed') : 'completed',
            isCreating: false,
            progress: {
              ...get().progress,
              currentOperation: hasFailures ? 'Some transactions failed' : 'All transactions completed successfully'
            }
          });

          console.log('📈 Transaction Results:', {
            successful: createdTransactions.length,
            failed: failedTransactions.length,
            total: totalTransactions
          });

          return {
            success: !hasFailures || hasSuccesses,
            createdTransactions,
            failedTransactions,
            hasPartialSuccess: hasSuccesses && hasFailures
          };

        } catch (error) {
          console.error('💥 Critical error in transaction creation:', error);
          set({
            currentStep: 'failed',
            isCreating: false,
            lastError: error.message,
            errors: [error.message]
          });

          return {
            success: false,
            error: error.message
          };
        }
      },

      // Process transaction data and auto-add pending payments for MCP and MV
      processTransactionDataWithPending: (transactionData) => {
        console.log('🔄 Processing transaction data with auto-pending payments...');

        const processedData = { ...transactionData };

        // Process MCP transactions
        if (processedData.mcpTransactions?.length > 0) {
          processedData.mcpTransactions = processedData.mcpTransactions.map(mcpData => {
            const totalAmount = mcpData.item.pricing?.totalLinePrice || 0;
            const existingPayments = mcpData.payments || [];
            
            // Add auto-pending payment
            const updatedPayments = get().addAutoPendingPayment(totalAmount, existingPayments);
            
            console.log('📦 MCP Auto-Pending:', {
              itemName: mcpData.item.data?.name || mcpData.item.data?.package_name,
              totalAmount,
              existingPayments: existingPayments.length,
              updatedPayments: updatedPayments.length,
              pendingAmount: updatedPayments.find(p => p.isAutoPending)?.amount || 0
            });

            return {
              ...mcpData,
              payments: updatedPayments
            };
          });
        }

        // Process MV transactions
        if (processedData.mvTransactions?.length > 0) {
          processedData.mvTransactions = processedData.mvTransactions.map(mvData => {
            const totalAmount = mvData.item.pricing?.totalLinePrice || 0;
            const existingPayments = mvData.payments || [];
            
            // Add auto-pending payment
            const updatedPayments = get().addAutoPendingPayment(totalAmount, existingPayments);
            
            console.log('🎟️ MV Auto-Pending:', {
              itemName: mvData.item.data?.member_voucher_name,
              totalAmount,
              existingPayments: existingPayments.length,
              updatedPayments: updatedPayments.length,
              pendingAmount: updatedPayments.find(p => p.isAutoPending)?.amount || 0
            });

            return {
              ...mvData,
              payments: updatedPayments
            };
          });
        }

        return processedData;
      },

      // Create Services + Products transaction (combined)
      createServicesProductsTransaction: async (servicesProductsData) => {
        console.log('🛍️ Creating Services + Products transaction...');
        
        const { transactionDetails } = get();
        
        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          items: servicesProductsData.items.map(item => ({
            type: item.type,
            data: item.data,
            pricing: item.pricing,
            assignedEmployee: item.assignedEmployee || item.employee_id,
            remarks: item.remarks || ''
          })),
          payments: servicesProductsData.payments || []
        };

        console.log('📤 Services/Products payload:', payload);

        const response = await api.post('/st/services-products', payload);
        
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create services/products transaction');
        }

        return response.data.data;
      },

      // Create individual MCP transaction
      createMcpTransaction: async (mcpData) => {
        console.log('📦 Creating MCP transaction...');
        
        const { transactionDetails } = get();
        
        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          item: {
            type: mcpData.item.type,
            data: mcpData.item.data,
            pricing: mcpData.item.pricing,
            assignedEmployee: mcpData.item.assignedEmployee || mcpData.item.employee_id,
            remarks: mcpData.item.remarks || ''
          },
          payments: mcpData.payments || []
        };

        console.log('📤 MCP payload with auto-pending:', {
          ...payload,
          payments: payload.payments.map(p => ({
            methodId: p.methodId,
            methodName: p.methodName,
            amount: p.amount,
            isAutoPending: p.isAutoPending || false
          }))
        });

        const response = await api.post('/st/mcp', payload);
        
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MCP transaction');
        }

        return response.data.data;
      },

      // Create individual MV transaction
      createMvTransaction: async (mvData) => {
        console.log('🎟️ Creating MV transaction...');
        
        const { transactionDetails } = get();
        
        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          item: {
            type: mvData.item.type,
            data: mvData.item.data,
            pricing: mvData.item.pricing,
            assignedEmployee: mvData.item.assignedEmployee || mvData.item.employee_id,
            remarks: mvData.item.remarks || ''
          },
          payments: mvData.payments || []
        };

        console.log('📤 MV payload with auto-pending:', {
          ...payload,
          payments: payload.payments.map(p => ({
            methodId: p.methodId,
            methodName: p.methodName,
            amount: p.amount,
            isAutoPending: p.isAutoPending || false
          }))
        });

        // const response = await api.post('/st/mv', payload);
        const response = await api.post('/mv/create', payload);
        const mvId = response.data.data.voucher_id
        console.log(mvId)
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MV transaction');
        }

        return response.data.data;
      },

      // Retry failed transactions
      retryFailedTransactions: async () => {
        const { failedTransactions } = get();
        
        if (failedTransactions.length === 0) {
          return { success: true, message: 'No failed transactions to retry' };
        }

        console.log('🔄 Retrying failed transactions...');
        // Implementation for retry logic
        // This would recreate the failed transactions
        
        return { success: false, message: 'Retry functionality not implemented yet' };
      },

      // Validate transaction details
      validateTransactionDetails: () => {
        const { transactionDetails } = get();
        const errors = [];

        if (!transactionDetails.createdBy) {
          errors.push('Transaction creator is required');
        }

        if (!transactionDetails.handledBy) {
          errors.push('Transaction handler is required');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // Get transaction summary
      getTransactionSummary: () => {
        const state = get();
        return {
          isCreating: state.isCreating,
          currentStep: state.currentStep,
          progress: state.progress,
          totalCreated: state.createdTransactions.length,
          totalFailed: state.failedTransactions.length,
          errors: state.errors,
          transactionDetails: state.transactionDetails
        };
      },

      // Reset store
      reset: () => {
        console.log('🧹 Resetting sale transaction store');
        set(getInitialState());
      },

      // Clear errors
      clearErrors: () => {
        set({ errors: [], lastError: null });
      }
    }),
    { name: 'sale-transaction-store' }
  )
);

export default useSaleTransactionStore;