// stores/useSaleTransactionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';

const getInitialState = () => ({
  // Transaction creation state
  isCreating: false,
  currentStep: 'idle', // 'idle', 'preparing', 'creating', 'completed', 'failed'
  createdTransactions: [],
  failedTransactions: [],
  
  // Transaction creation progress
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
    currentOperation: ''
  },

  // Error handling
  errors: [],
  lastError: null,
});

const useSaleTransactionStore = create(
  devtools(
    (set, get) => ({
      ...getInitialState(),

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
          // Calculate total number of transactions to create
          const servicesProductsCount = transactionData.servicesProducts?.items?.length > 0 ? 1 : 0;
          const mcpCount = transactionData.mcpTransactions?.length || 0;
          const mvCount = transactionData.mvTransactions?.length || 0;
          const totalTransactions = servicesProductsCount + mcpCount + mvCount;

          console.log('📊 Transaction Summary:', {
            servicesProducts: servicesProductsCount,
            mcpTransactions: mcpCount,
            mvTransactions: mvCount,
            total: totalTransactions
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
          if (transactionData.servicesProducts?.items?.length > 0) {
            set(state => ({
              progress: { 
                ...state.progress, 
                currentOperation: 'Creating Services & Products transaction...' 
              }
            }));

            try {
              const servicesTransaction = await get().createServicesProductsTransaction(
                transactionData.servicesProducts,
                transactionData.member,
                transactionData.handlers,
                transactionData.transactionNumber,
                transactionData.transactionRemark
              );
              
              createdTransactions.push({
                type: 'services-products',
                transaction: servicesTransaction,
                items: transactionData.servicesProducts.items
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
                data: transactionData.servicesProducts
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
          if (transactionData.mcpTransactions?.length > 0) {
            for (let i = 0; i < transactionData.mcpTransactions.length; i++) {
              const mcpData = transactionData.mcpTransactions[i];
              
              set(state => ({
                progress: { 
                  ...state.progress, 
                  currentOperation: `Creating MCP transaction ${i + 1}/${transactionData.mcpTransactions.length}...` 
                }
              }));

              try {
                const mcpTransaction = await get().createMcpTransaction(
                  mcpData,
                  transactionData.member,
                  transactionData.handlers,
                  transactionData.transactionNumber,
                  transactionData.transactionRemark
                );
                
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
          if (transactionData.mvTransactions?.length > 0) {
            for (let i = 0; i < transactionData.mvTransactions.length; i++) {
              const mvData = transactionData.mvTransactions[i];
              
              set(state => ({
                progress: { 
                  ...state.progress, 
                  currentOperation: `Creating MV transaction ${i + 1}/${transactionData.mvTransactions.length}...` 
                }
              }));

              try {
                const mvTransaction = await get().createMvTransaction(
                  mvData,
                  transactionData.member,
                  transactionData.handlers,
                  transactionData.transactionNumber,
                  transactionData.transactionRemark
                );
                
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

      // Create Services + Products transaction (combined)
      createServicesProductsTransaction: async (servicesProductsData, member, handlers, transactionNumber, transactionRemark) => {
        console.log('🛍️ Creating Services + Products transaction...');
        
        const payload = {
          customer_type: 'member',
          member_id: member?.id,
          transaction_number: transactionNumber,
          remarks: transactionRemark,
          transaction_handler_id: handlers.transaction,
          payment_handler_id: handlers.payment,
          items: servicesProductsData.items.map(item => ({
            type: item.type,
            id: item.data.id || item.data.service_id || item.data.product_id,
            name: item.data.name,
            quantity: item.pricing?.quantity || item.data.quantity || 1,
            original_price: item.pricing?.originalPrice || item.data.price,
            custom_price: item.pricing?.customPrice || 0,
            discount: item.pricing?.discount || 0,
            final_price: item.pricing?.finalUnitPrice || item.data.price,
            total_amount: item.pricing?.totalLinePrice || (item.data.price * (item.data.quantity || 1)),
            employee_id: item.employee_id
          })),
          payments: servicesProductsData.payments || [],
          total_amount: servicesProductsData.totalAmount
        };

        const response = await api.post('/sale-transactions/services-products', payload);
        
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create services/products transaction');
        }

        return response.data.data;
      },

      // Create individual MCP transaction
      createMcpTransaction: async (mcpData, member, handlers, transactionNumber, transactionRemark) => {
        console.log('📦 Creating MCP transaction...');
        
        const payload = {
          customer_type: 'member',
          member_id: member?.id,
          transaction_number: transactionNumber,
          remarks: transactionRemark,
          transaction_handler_id: handlers.transaction,
          payment_handler_id: handlers.payment,
          mcp_item: {
            id: mcpData.item.data.id,
            name: mcpData.item.data.name,
            original_price: mcpData.item.pricing?.originalPrice || mcpData.item.data.price,
            custom_price: mcpData.item.pricing?.customPrice || 0,
            discount: mcpData.item.pricing?.discount || 0,
            final_price: mcpData.item.pricing?.finalUnitPrice || mcpData.item.data.price,
            total_amount: mcpData.item.pricing?.totalLinePrice || mcpData.item.data.price,
            employee_id: mcpData.item.employee_id
          },
          payments: mcpData.payments || [],
          total_amount: mcpData.totalAmount
        };

        const response = await api.post('/sale-transactions/mcp', payload);
        
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MCP transaction');
        }

        return response.data.data;
      },

      // Create individual MV transaction
      createMvTransaction: async (mvData, member, handlers, transactionNumber, transactionRemark) => {
        console.log('🎟️ Creating MV transaction...');
        
        const payload = {
          customer_type: 'member',
          member_id: member?.id,
          transaction_number: transactionNumber,
          remarks: transactionRemark,
          transaction_handler_id: handlers.transaction,
          payment_handler_id: handlers.payment,
          mv_item: {
            id: mvData.item.data.id,
            name: mvData.item.data.member_voucher_name,
            total_price: mvData.item.data.total_price,
            starting_balance: mvData.item.data.starting_balance,
            free_of_charge: mvData.item.data.free_of_charge,
            voucher_details: mvData.item.data.member_voucher_details
          },
          payments: mvData.payments || [],
          total_amount: mvData.totalAmount
        };

        const response = await api.post('/sale-transactions/mv', payload);
        
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

      // Get transaction summary
      getTransactionSummary: () => {
        const state = get();
        return {
          isCreating: state.isCreating,
          currentStep: state.currentStep,
          progress: state.progress,
          totalCreated: state.createdTransactions.length,
          totalFailed: state.failedTransactions.length,
          errors: state.errors
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