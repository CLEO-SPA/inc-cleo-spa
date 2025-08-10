import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/services/api';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';
import useTransferVoucherStore from '@/stores/useTransferVoucherStore';

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
    currentOperation: '',
  },

  // General transaction details with creation date/time fields
  transactionDetails: {
    receiptNumber: '',
    transactionRemark: '',
    createdBy: null,
    handledBy: null,
    memberId: null,
    customerType: 'MEMBER',
    createdAt: new Date().toISOString().slice(0, 16),
    updatedAt: new Date().toISOString().slice(0, 16),
  },

  // Error handling
  errors: [],
  lastError: null,
});
const roundTo2Decimals = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};
const useSaleTransactionStore = create(
  devtools(
    (set, get) => ({
      ...getInitialState(),

      // Constants
      PENDING_PAYMENT_METHOD_ID: 7,

      // Helper function to calculate outstanding amount and add pending payment
      // Uses INCLUSIVE amounts (with GST)
      addAutoPendingPayment: (totalAmount, existingPayments) => {
  // Calculate total paid amount from existing payments (excluding pending payments)
  const totalPaid = existingPayments.reduce((sum, payment) => {
    // Only count actual payments, not pending ones (methodId 7)
    if (payment.methodId === get().PENDING_PAYMENT_METHOD_ID) {
      return sum; // Don't include pending payments in total paid calculation
    }
    return sum + (payment.amount || 0);
  }, 0);

  // Calculate outstanding amount based on INCLUSIVE total
  const outstandingAmount = roundTo2Decimals(totalAmount - totalPaid);

  // Check if there's already a pending payment
  const existingPendingPayment = existingPayments.find(
    (payment) => payment.methodId === get().PENDING_PAYMENT_METHOD_ID
  );

  let updatedPayments = [...existingPayments];

  if (outstandingAmount > 0.01) {
    if (existingPendingPayment) {
      // Update existing pending payment amount
      updatedPayments = updatedPayments.map((payment) =>
        payment.methodId === get().PENDING_PAYMENT_METHOD_ID 
          ? { ...payment, amount: outstandingAmount }
          : payment
      );
    } else {
      // Add new pending payment
      updatedPayments.push({
        id: crypto.randomUUID(),
        methodId: get().PENDING_PAYMENT_METHOD_ID,
        methodName: 'Pending',
        amount: outstandingAmount,
        remark: 'Auto-generated pending payment for outstanding amount',
        isAutoPending: true,
      });
    }
  } else if (outstandingAmount <= 0.01 && existingPendingPayment) {
    // Remove pending payment if outstanding amount is 0 or negative
    updatedPayments = updatedPayments.filter(
      (payment) => payment.methodId !== get().PENDING_PAYMENT_METHOD_ID || !payment.isAutoPending
    );
  }

  return updatedPayments;
},

      // Helper function to calculate GST breakdown from inclusive amount
      calculateGSTBreakdown: (inclusiveAmount, gstRate = 9) => {
        const exclusive = inclusiveAmount / (1 + gstRate / 100);
        const gst = inclusiveAmount - exclusive;
        return {
          inclusive: roundTo2Decimals(inclusiveAmount),
          exclusive: roundTo2Decimals(exclusive),
          gst: roundTo2Decimals(gst),
          gstRate: gstRate
        };
      },

      // Helper function to calculate GST from exclusive amount
      calculateGSTFromExclusive: (exclusiveAmount, gstRate = 9) => {
        const gstAmount = exclusiveAmount * (gstRate / 100);
        const inclusiveAmount = exclusiveAmount + gstAmount;
        return {
          exclusive: roundTo2Decimals(exclusiveAmount),
          gst: roundTo2Decimals(gstAmount),
          inclusive: roundTo2Decimals(inclusiveAmount),
          gstRate: gstRate
        };
      },

      // Update transaction details
      updateTransactionDetails: (details) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            ...details,
          },
        }));
      },

      // Set creation date/time
      setCreatedAt: (createdAt) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            createdAt,
            updatedAt: createdAt,
          },
        }));
      },

      // Set updated date/time
      setUpdatedAt: (updatedAt) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            updatedAt,
          },
        }));
      },

      // Set receipt number
      setReceiptNumber: (receiptNumber) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            receiptNumber,
          },
        }));
      },

      // Set transaction remark
      setTransactionRemark: (transactionRemark) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            transactionRemark,
          },
        }));
      },

      // Set created by employee
      setCreatedBy: (createdBy) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            createdBy,
          },
        }));
      },

      // Set handled by employee
      setHandledBy: (handledBy) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            handledBy,
          },
        }));
      },

      // Set member info
      setMemberInfo: (member) => {
        set((state) => ({
          transactionDetails: {
            ...state.transactionDetails,
            memberId: member?.id || null,
            customerType: member ? 'MEMBER' : 'WALK_IN',
          },
        }));
      },

      // Process cart data with correct GST calculations for backend
      processCartDataForBackend: (cartItems, itemPricing, sectionPayments, gstRate = 9) => {
        const processedData = {
          servicesProducts: null,
          mcpTransactions: [],
          mvTransactions: [],
          mcpTransferTransactions: [],
          mvTransferTransactions: []
        };

        // Group items by type
        const groupedItems = {
          Services: cartItems.filter(item => item.type === 'service'),
          Products: cartItems.filter(item => item.type === 'product'),
          Packages: cartItems.filter(item => item.type === 'package'),
          Vouchers: cartItems.filter(item => item.type === 'member-voucher'),
          TransferMCP: cartItems.filter(item => item.type === 'transferMCP'),
          TransferMV: cartItems.filter(item => item.type === 'transferMV'),
        };

        // Process Services + Products
        const servicesAndProducts = [...groupedItems.Services, ...groupedItems.Products];
        if (servicesAndProducts.length > 0) {
          const sectionPaymentsData = sectionPayments['services-products'] || [];
          
          // Calculate total exclusive amount
          const totalExclusive = servicesAndProducts.reduce((sum, item) => {
            return sum + (itemPricing[item.id]?.totalLinePrice || 0);
          }, 0);
          
          // Calculate GST breakdown
          const gstBreakdown = get().calculateGSTFromExclusive(totalExclusive, gstRate);
          
          // Use INCLUSIVE amount for pending payment calculation
          const updatedPayments = get().addAutoPendingPayment(gstBreakdown.inclusive, sectionPaymentsData);
          
          processedData.servicesProducts = {
            items: servicesAndProducts.map(item => ({
              ...item,
              pricing: {
                ...itemPricing[item.id],
                gstBreakdown: get().calculateGSTFromExclusive(itemPricing[item.id]?.totalLinePrice || 0, gstRate)
              }
            })),
            payments: updatedPayments,
            gstBreakdown: gstBreakdown
          };
        }

        // ✅ FIXED: Process Packages with INCLUSIVE amounts for pending calculation
  groupedItems.Packages.forEach(item => {
  const sectionId = `package-${item.id}`;
  const sectionPaymentsData = sectionPayments[sectionId] || [];
  
  const exclusiveAmount = itemPricing[item.id]?.totalLinePrice || 0;
  const gstBreakdown = get().calculateGSTFromExclusive(exclusiveAmount, gstRate);
  
  // Use INCLUSIVE amount for pending payment calculation
  const updatedPayments = get().addAutoPendingPayment(gstBreakdown.inclusive, sectionPaymentsData);
  
  processedData.mcpTransactions.push({
    item: {
      ...item,
      pricing: {
        ...itemPricing[item.id],
        gstBreakdown: gstBreakdown
      }
    },
    payments: updatedPayments,
    gstBreakdown: gstBreakdown
  });
});

        // ✅ FIXED: Process Vouchers with INCLUSIVE amounts for pending calculation
        groupedItems.Vouchers.forEach(item => {
          const sectionId = `voucher-${item.id}`;
          const sectionPaymentsData = sectionPayments[sectionId] || [];
          const exclusiveAmount = itemPricing[item.id]?.totalLinePrice || 0;
          const gstBreakdown = get().calculateGSTFromExclusive(exclusiveAmount, gstRate);
          
          // Use INCLUSIVE amount for pending payment calculation
          const updatedPayments = get().addAutoPendingPayment(gstBreakdown.inclusive, sectionPaymentsData);
          
          processedData.mvTransactions.push({
            item: {
              ...item,
              pricing: {
                ...itemPricing[item.id],
                gstBreakdown: gstBreakdown
              }
            },
            payments: updatedPayments,
            gstBreakdown: gstBreakdown
          });
        });

        // Process MCP Transfers (no GST)
        groupedItems.TransferMCP.forEach(item => {
          const sectionId = `transfer-mcp-${item.id}`;
          const sectionPaymentsData = sectionPayments[sectionId] || [];
          
          const amount = itemPricing[item.id]?.totalLinePrice || 0;
          
          processedData.mcpTransferTransactions.push({
            item: {
              ...item,
              pricing: {
                ...itemPricing[item.id],
                gstBreakdown: {
                  inclusive: amount,
                  exclusive: amount,
                  gst: 0,
                  gstRate: 0
                }
              }
            },
            payments: sectionPaymentsData,
            gstBreakdown: {
              inclusive: amount,
              exclusive: amount,
              gst: 0,
              gstRate: 0
            }
          });
        });

        // Process MV Transfers (with GST)
        groupedItems.TransferMV.forEach(item => {
          const sectionId = `transfer-mv-${item.id}`;
          const sectionPaymentsData = sectionPayments[sectionId] || [];
          
          const exclusiveAmount = itemPricing[item.id]?.totalLinePrice || 0;
          const gstBreakdown = get().calculateGSTFromExclusive(exclusiveAmount, gstRate);
          
          // ✅ CRITICAL: Use INCLUSIVE amount for pending payment calculation
          const updatedPayments = get().addAutoPendingPayment(gstBreakdown.inclusive, sectionPaymentsData);
          
          processedData.mvTransferTransactions.push({
            item: {
              ...item,
              pricing: {
                ...itemPricing[item.id],
                gstBreakdown: gstBreakdown
              }
            },
            payments: updatedPayments,
            gstBreakdown: gstBreakdown
          });
        });

        return processedData;
      },

      // Main orchestration function
      createSaleTransactions: async (transactionData) => {
        set({
          isCreating: true,
          currentStep: 'preparing',
          createdTransactions: [],
          failedTransactions: [],
          errors: [],
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

          if (!transactionDetails.createdAt) {
            throw new Error('Creation date & time is required');
          }

          // ✅ FIXED: Process transaction data with correct pending payments
          const processedTransactionData = get().processTransactionDataWithPending(transactionData);

          // Calculate total number of transactions to create
          const servicesProductsCount = processedTransactionData.servicesProducts?.items?.length > 0 ? 1 : 0;
          const mcpCount = processedTransactionData.mcpTransactions?.length || 0;
          const mvCount = processedTransactionData.mvTransactions?.length || 0;
          const mcpTransferCount = processedTransactionData.mcpTransferTransactions?.length || 0;
          const mvTransferCount = processedTransactionData.mvTransferTransactions?.length || 0;
          const totalTransactions = servicesProductsCount + mcpCount + mvCount + mcpTransferCount + mvTransferCount;



          set({
            currentStep: 'creating',
            progress: {
              total: totalTransactions,
              completed: 0,
              failed: 0,
              currentOperation: 'Starting transaction creation...',
            },
          });

          const createdTransactions = [];
          const failedTransactions = [];

          // 1. Create Services + Products transaction (if exists)
          if (processedTransactionData.servicesProducts?.items?.length > 0) {
            set((state) => ({
              progress: {
                ...state.progress,
                currentOperation: 'Creating Services & Products transaction...',
              },
            }));

            try {
              const servicesTransaction = await get().createServicesProductsTransaction(
                processedTransactionData.servicesProducts
              );

              createdTransactions.push({
                type: 'services-products',
                transaction: servicesTransaction,
                items: processedTransactionData.servicesProducts.items,
              });

              set((state) => ({
                progress: {
                  ...state.progress,
                  completed: state.progress.completed + 1,
                },
              }));
            } catch (error) {
              failedTransactions.push({
                type: 'services-products',
                error: error.message,
                data: processedTransactionData.servicesProducts,
              });

              set((state) => ({
                progress: {
                  ...state.progress,
                  failed: state.progress.failed + 1,
                },
                errors: [...state.errors, `Services/Products: ${error.message}`],
              }));
            }
          }

          // 2. Create individual MCP transactions
          if (processedTransactionData.mcpTransactions?.length > 0) {
            let mcpCreationResult = null;

            try {
              const mcpFormStore = useMcpFormStore.getState();
              mcpCreationResult = await mcpFormStore.processMcpCreationQueue(get().transactionDetails.createdAt);
            } catch (error) {
              set((state) => ({
                errors: [...state.errors, `MCP Creation Queue: ${error.message}`],
              }));
            }

            // Extract created packages from the result
            const createdPackages = mcpCreationResult?.results?.createdPackages || [];

            for (let i = 0; i < processedTransactionData.mcpTransactions.length; i++) {
              const mcpData = processedTransactionData.mcpTransactions[i];

              set((state) => ({
                progress: {
                  ...state.progress,
                  currentOperation: `Creating MCP transaction ${i + 1}/${
                    processedTransactionData.mcpTransactions.length
                  }...`,
                },
              }));

              try {
                // Get the corresponding MCP ID from creation results
                const correspondingPackage = createdPackages[i];
                const actualMcpId = correspondingPackage?.memberCarePackageId;

                if (!actualMcpId) {
                  throw new Error(`No MCP ID found for transaction item at index ${i}`);
                }

                // Update the mcpData with the actual MCP ID
                const updatedMcpData = {
                  ...mcpData,
                  item: {
                    ...mcpData.item,
                    data: {
                      ...mcpData.item.data,
                      id: actualMcpId,
                      member_care_package_id: actualMcpId,
                    },
                  },
                };



                const mcpTransaction = await get().createMcpTransaction(updatedMcpData);

                createdTransactions.push({
                  type: 'mcp',
                  transaction: mcpTransaction,
                  item: updatedMcpData.item,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    completed: state.progress.completed + 1,
                  },
                }));
              } catch (error) {
                failedTransactions.push({
                  type: 'mcp',
                  error: error.message,
                  data: mcpData,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    failed: state.progress.failed + 1,
                  },
                  errors: [...state.errors, `MCP (${mcpData.item.data?.name}): ${error.message}`],
                }));
              }
            }
          }

          // 3. Create individual MV transactions
          if (processedTransactionData.mvTransactions?.length > 0) {
            for (let i = 0; i < processedTransactionData.mvTransactions.length; i++) {
              const mvData = processedTransactionData.mvTransactions[i];

              set((state) => ({
                progress: {
                  ...state.progress,
                  currentOperation: `Creating MV transaction ${i + 1}/${
                    processedTransactionData.mvTransactions.length
                  }...`,
                },
              }));

              try {
                const mvTransaction = await get().createMvTransaction(mvData);

                createdTransactions.push({
                  type: 'mv',
                  transaction: mvTransaction,
                  item: mvData.item,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    completed: state.progress.completed + 1,
                  },
                }));
              } catch (error) {
                console.error('❌ MV transaction failed:', error);
                failedTransactions.push({
                  type: 'mv',
                  error: error.message,
                  data: mvData,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    failed: state.progress.failed + 1,
                  },
                  errors: [...state.errors, `MV (${mvData.item.data?.member_voucher_name}): ${error.message}`],
                }));
              }
            }
          }

          // 4. Create individual MCP Transfer transactions
          if (processedTransactionData.mcpTransferTransactions?.length > 0) {
            let mcpTransferResult = null;

            try {
              const mcpFormStore = useMcpFormStore.getState();
              mcpTransferResult = await mcpFormStore.processMcpTransferQueue(get().transactionDetails.createdAt);
              console.log('✅ MCP transfer queue processed successfully:', mcpTransferResult);
            } catch (error) {
              console.error('❌ MCP transfer queue processing failed:', error);
              set((state) => ({
                errors: [...state.errors, `MCP Transfer Queue: ${error.message}`],
              }));
            }

            // Extract transferred packages from the result
            const transferredPackages = mcpTransferResult?.packages || [];

            for (let i = 0; i < processedTransactionData.mcpTransferTransactions.length; i++) {
              const mcpTransferData = processedTransactionData.mcpTransferTransactions[i];

              set((state) => ({
                progress: {
                  ...state.progress,
                  currentOperation: `Creating MCP Transfer transaction ${i + 1}/${
                    processedTransactionData.mcpTransferTransactions.length
                  }...`,
                },
              }));

              try {
                // Get the corresponding transfer result from the queue processing
                const correspondingTransfer = transferredPackages[i];

                if (!correspondingTransfer) {
                  throw new Error(`No transfer result found for transaction item at index ${i}`);
                }

                // Update the mcpTransferData with the actual transfer details
                const updatedMcpTransferData = {
                  ...mcpTransferData,
                  item: {
                    ...mcpTransferData.item,
                    data: {
                      ...mcpTransferData.item.data,
                      mcp_id1: correspondingTransfer.mcp_id1,
                      mcp_id2: correspondingTransfer.mcp_id2,
                      isNew: correspondingTransfer.isNew,
                      amount: correspondingTransfer.amount,
                    },
                  },
                };



                const mcpTransferTransaction = await get().createMcpTransferTransaction(updatedMcpTransferData);

                createdTransactions.push({
                  type: 'mcp-transfer',
                  transaction: mcpTransferTransaction,
                  item: updatedMcpTransferData.item,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    completed: state.progress.completed + 1,
                  },
                }));
              } catch (error) {
                console.error('❌ MCP Transfer transaction failed:', error);
                failedTransactions.push({
                  type: 'mcp-transfer',
                  error: error.message,
                  data: mcpTransferData,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    failed: state.progress.failed + 1,
                  },
                  errors: [
                    ...state.errors,
                    `MCP Transfer (${mcpTransferData.item.data?.description || 'Transfer'}): ${error.message}`,
                  ],
                }));
              }
            }
          }

          // 5. Create individual MV Transfer transactions
          if (processedTransactionData.mvTransferTransactions?.length > 0) {
            const transferStore = useTransferVoucherStore.getState();
            const transferFormData = transferStore.transferFormData;

            if (!transferFormData) {
              throw new Error('No transfer data available in TransferVoucherStore');
            }

            for (let i = 0; i < processedTransactionData.mvTransferTransactions.length; i++) {
              const mvTransferData = processedTransactionData.mvTransferTransactions[i];

              set((state) => ({
                progress: {
                  ...state.progress,
                  currentOperation: `Creating MV Transfer transaction ${i + 1}/${
                    processedTransactionData.mvTransferTransactions.length
                  }...`,
                },
              }));

              try {
                const transferFormDataWithSaleTransactionDate = {
                  ...transferFormData,
                  created_at: transactionDetails.createdAt,  
                  updated_at: transactionDetails.updatedAt   
                };

                const response = await transferStore.submitTransfer(transferFormDataWithSaleTransactionDate);

                if (response.success && response.newVoucherId) {
                  const newVoucherId = response.newVoucherId;

                  const mvTransferDataWithId = {
                    ...mvTransferData,
                    newVoucherId,
                  };

                  const mvTransferTransaction = await get().createMvTransferTransaction(mvTransferDataWithId);

                  createdTransactions.push({
                    type: 'mv-transfer',
                    transaction: mvTransferTransaction,
                    item: mvTransferData.item,
                  });

                  set((state) => ({
                    progress: {
                      ...state.progress,
                      completed: state.progress.completed + 1,
                    },
                  }));
                } else {
                  throw new Error(response.message || 'Unknown error during voucher transfer');
                }
              } catch (error) {
                console.error('❌ MV Transfer transaction failed:', error);
                failedTransactions.push({
                  type: 'mv-transfer',
                  error: error.message,
                  data: mvTransferData,
                });

                set((state) => ({
                  progress: {
                    ...state.progress,
                    failed: state.progress.failed + 1,
                  },
                  errors: [
                    ...state.errors,
                    `MV Transfer (${mvTransferData.item.data?.description || 'Transfer'}): ${error.message}`,
                  ],
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
              currentOperation: hasFailures ? 'Some transactions failed' : 'All transactions completed successfully',
            },
          });

          console.log('📈 Transaction Results:', {
            successful: createdTransactions.length,
            failed: failedTransactions.length,
            total: totalTransactions,
          });

          return {
            success: !hasFailures || hasSuccesses,
            createdTransactions,
            failedTransactions,
            hasPartialSuccess: hasSuccesses && hasFailures,
          };
        } catch (error) {
          console.error('💥 Critical error in transaction creation:', error);
          set({
            currentStep: 'failed',
            isCreating: false,
            lastError: error.message,
            errors: [error.message],
          });

          return {
            success: false,
            error: error.message,
          };
        }
      },

      // Process transaction data with correct pending payments
      processTransactionDataWithPending: (transactionData) => {
        const processedData = { ...transactionData };

        // Process MCP transactions
if (processedData.mcpTransactions?.length > 0) {
  processedData.mcpTransactions = processedData.mcpTransactions.map((mcpData) => {
    const gstBreakdown = mcpData.gstBreakdown;
    const existingPayments = mcpData.payments || [];

    // Calculate inclusive amount if gstBreakdown is missing
    let totalAmount;
    if (gstBreakdown?.inclusive) {
      totalAmount = gstBreakdown.inclusive;
    } else {
      // Calculate GST breakdown if missing
      const exclusiveAmount = mcpData.item.pricing?.totalLinePrice || 0;
      const calculatedGstBreakdown = get().calculateGSTFromExclusive(exclusiveAmount, 9);
      totalAmount = calculatedGstBreakdown.inclusive;
    }

    // ✅ FIXED: Use INCLUSIVE amount for pending calculation
    const updatedPayments = get().addAutoPendingPayment(totalAmount, existingPayments);



    return {
      ...mcpData,
      payments: updatedPayments,
    };
  });
}

        // Process MV transactions
if (processedData.mvTransactions?.length > 0) {
  processedData.mvTransactions = processedData.mvTransactions.map((mvData) => {
    const gstBreakdown = mvData.gstBreakdown;
    const existingPayments = mvData.payments || [];

    // ✅ FIXED: Calculate inclusive amount if gstBreakdown is missing
    let totalAmount;
    if (gstBreakdown?.inclusive) {
      totalAmount = gstBreakdown.inclusive;
    } else {
      // Calculate GST breakdown if missing
      const exclusiveAmount = mvData.item.pricing?.totalLinePrice || 0;
      const calculatedGstBreakdown = get().calculateGSTFromExclusive(exclusiveAmount, 9);
      totalAmount = calculatedGstBreakdown.inclusive;
    }

    // ✅ FIXED: Use INCLUSIVE amount for pending calculation
    const updatedPayments = get().addAutoPendingPayment(totalAmount, existingPayments);



    return {
      ...mvData,
      payments: updatedPayments,
    };
  });
}

        // Process MCP Transfer transactions (no auto-pending needed, transfers are fully paid)
        if (processedData.mcpTransferTransactions?.length > 0) {
          processedData.mcpTransferTransactions = processedData.mcpTransferTransactions.map((mcpTransferData) => {
            return mcpTransferData; // No changes needed for transfer transactions
          });
        }

        // Process MV Transfer transactions (no auto-pending needed, transfers are fully paid)
        if (processedData.mvTransferTransactions?.length > 0) {
          processedData.mvTransferTransactions = processedData.mvTransferTransactions.map((mvTransferData) => {
            return mvTransferData; // No changes needed for transfer transactions
          });
        }

        return processedData;
      },

      // ✅ UPDATED: Create Services + Products transaction with GST breakdown
      createServicesProductsTransaction: async (servicesProductsData) => {



        const { transactionDetails } = get();

        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          created_at: transactionDetails.createdAt,
          updated_at: transactionDetails.updatedAt,
          
          // Include GST breakdown in payload
          gstBreakdown: servicesProductsData.gstBreakdown,
          
          items: servicesProductsData.items.map((item, index) => {
            const mappedItem = {
              type: item.type,
              data: item.data,
              pricing: item.pricing,
              assignedEmployee: item.assignedEmployee || item.employee_id,
              remarks: item.remarks || ''
            };
            

            
            return mappedItem;
          }),
          payments: servicesProductsData.payments || []
        };



        const response = await api.post('/st/services-products', payload);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create services/products transaction');
        }

        return response.data.data;
      },

      // ✅ UPDATED: Create individual MCP transaction with creation date/time and GST
      createMcpTransaction: async (mcpData) => {
        const { transactionDetails } = get();

        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          created_at: transactionDetails.createdAt,
          updated_at: transactionDetails.updatedAt,
          item: {
            type: mcpData.item.type,
            data: mcpData.item.data,
            pricing: mcpData.item.pricing,
            assignedEmployee: mcpData.item.assignedEmployee || mcpData.item.employee_id,
            remarks: mcpData.item.remarks || '',
          },
          payments: mcpData.payments || [],
          gstBreakdown: mcpData.gstBreakdown,
        };

        const response = await api.post('/st/mcp', payload);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MCP transaction');
        }

        return response.data.data;
      },

      // ✅ UPDATED: Create individual MV transaction with creation date/time and GST
      createMvTransaction: async (mvData) => {
        const { transactionDetails } = get();

        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          created_at: transactionDetails.createdAt,
          updated_at: transactionDetails.updatedAt,
          item: {
            type: mvData.item.type,
            data: mvData.item.data,
            pricing: mvData.item.pricing,
            assignedEmployee: mvData.item.assignedEmployee || mvData.item.employee_id,
            remarks: mvData.item.remarks || '',
          },
          payments: mvData.payments || [],
          gstBreakdown: mvData.gstBreakdown,
        };

        const response = await api.post('/mv/create', payload);
        const mvId = response.data.data.voucher_id;

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MV transaction');
        }

        return response.data.data;
      },

      // ✅ UPDATED: Create individual MCP Transfer transaction with creation date/time
      createMcpTransferTransaction: async (mcpTransferData) => {
        const { transactionDetails } = get();

        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          created_at: transactionDetails.createdAt,
          updated_at: transactionDetails.updatedAt,
          item: {
            type: mcpTransferData.item.type,
            data: mcpTransferData.item.data,
            pricing: mcpTransferData.item.pricing,
            assignedEmployee: mcpTransferData.item.assignedEmployee || mcpTransferData.item.employee_id,
            remarks: mcpTransferData.item.remarks || '',
          },
          payments: mcpTransferData.payments || [],
          gstBreakdown: mcpTransferData.gstBreakdown,
        };

        const response = await api.post('/st/mcp-transfer', payload);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MCP Transfer transaction');
        }

        return response.data.data;
      },

      // ✅ UPDATED: Create individual MV Transfer transaction with creation date/time and GST
      createMvTransferTransaction: async (mvTransferData) => {
        const { transactionDetails } = get();

        const payload = {
          customer_type: transactionDetails.customerType,
          member_id: transactionDetails.memberId,
          receipt_number: transactionDetails.receiptNumber,
          remarks: transactionDetails.transactionRemark,
          created_by: transactionDetails.createdBy,
          handled_by: transactionDetails.handledBy,
          created_at: transactionDetails.createdAt,
          updated_at: transactionDetails.updatedAt,
          item: {
            type: mvTransferData.item.type,
            data: mvTransferData.item.data,
            pricing: mvTransferData.item.pricing,
            assignedEmployee: mvTransferData.item.assignedEmployee || mvTransferData.item.employee_id,
            remarks: mvTransferData.item.remarks || '',
          },
          payments: mvTransferData.payments || [],
          newVoucherId: mvTransferData.newVoucherId,
          gstBreakdown: mvTransferData.gstBreakdown,
        };

        const response = await api.post('/st/mv-transfer', payload);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to create MV Transfer transaction');
        }

        return response.data.data;
      },

      // Retry failed transactions
      retryFailedTransactions: async () => {
        const { failedTransactions } = get();

        if (failedTransactions.length === 0) {
          return { success: true, message: 'No failed transactions to retry' };
        }

        return { success: false, message: 'Retry functionality not implemented yet' };
      },

      // ✅ UPDATED: Validate transaction details including creation date/time
      validateTransactionDetails: () => {
        const { transactionDetails } = get();
        const errors = [];

        if (!transactionDetails.createdBy) {
          errors.push('Transaction creator is required');
        }

        if (!transactionDetails.handledBy) {
          errors.push('Transaction handler is required');
        }

        if (!transactionDetails.createdAt) {
          errors.push('Creation date & time is required');
        } else {
          try {
            const dateValue = new Date(transactionDetails.createdAt);
            if (isNaN(dateValue.getTime())) {
              errors.push('Creation date & time is invalid');
            }
          } catch (error) {
            errors.push('Creation date & time is invalid');
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
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
          transactionDetails: state.transactionDetails,
        };
      },

      // Reset store
      reset: () => {
        set(getInitialState());
      },

      // Clear errors
      clearErrors: () => {
        set({ errors: [], lastError: null });
      },
    }),
    { name: 'sale-transaction-store' }
  )
);

export default useSaleTransactionStore;