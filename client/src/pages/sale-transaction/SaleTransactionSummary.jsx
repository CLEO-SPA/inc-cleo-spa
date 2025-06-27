import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import useSaleTransactionStore from '@/stores/SaleTransaction/useSaleTransactionStore';
import CartItemsWithPayment from './CartItemsWithPayment';

const SaleTransactionSummary = () => {
  const navigate = useNavigate();
  
  // Get cart data from store
  const { selectedMember, cartItems, clearCart } = useTransactionCartStore();
  
  // Get sale transaction store - including transaction details management
  const { 
    isCreating, 
    currentStep, 
    progress, 
    createdTransactions,
    failedTransactions,
    errors,
    transactionDetails,
    setReceiptNumber,
    setTransactionRemark,
    setCreatedBy,
    setHandledBy,
    setMemberInfo,
    createSaleTransactions,
    validateTransactionDetails,
    reset: resetTransactionStore
  } = useSaleTransactionStore();
  
  // State for cart items and payments (managed by child component)
  const [itemEmployees, setItemEmployees] = useState({});
  const [itemPricing, setItemPricing] = useState({});
  const [itemRemarks, setItemRemarks] = useState({});
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState({});
  const [sectionPayments, setSectionPayments] = useState({});
  
  // Modal state
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Debug state
  const [showDebug, setShowDebug] = useState(true);

  // Initialize member info in store when component mounts or selectedMember changes
  useEffect(() => {
    setMemberInfo(selectedMember);
  }, [selectedMember, setMemberInfo]);
  
  // Get cart total (uses pricing data)
  const getUpdatedCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const pricing = getItemPricing(item.id);
      return total + pricing.totalLinePrice;
    }, 0);
  };

  // Initialize itemEmployees, itemPricing, and itemRemarks with any existing assignments
  useEffect(() => {
    const initialAssignments = {};
    const initialPricing = {};
    const initialRemarks = {};
    
    cartItems.forEach(item => {
      // Auto-assign employee for vouchers with created_by
      if (item.type === 'member-voucher' && item.data?.created_by) {
        initialAssignments[item.id] = item.data.created_by.toString();
      } else if (item.data?.employee_id) {
        initialAssignments[item.id] = item.data.employee_id;
      }
      
      // Initialize pricing data for each item
      let originalPrice;
      if (item.type === 'transfer' || item.type === 'transferMCP' || item.type === 'transferMV') {
        originalPrice = item.data?.amount || 0;
      } else {
        originalPrice = item.data?.price || item.data?.total_price || 0;
      }
      const quantity = item.data?.quantity || 1;
      
      initialPricing[item.id] = {
        originalPrice: originalPrice,
        customPrice: 0,
        discount: 0,
        quantity: quantity,
        finalUnitPrice: originalPrice,
        totalLinePrice: originalPrice * quantity
      };

      // Initialize remarks for each item
      initialRemarks[item.id] = item.remarks || '';
    });
    
    setItemEmployees(initialAssignments);
    setItemPricing(initialPricing);
    setItemRemarks(initialRemarks);
  }, [cartItems]);

  // Get item pricing data
  const getItemPricing = (itemId) => {
    return itemPricing[itemId] || {
      originalPrice: 0,
      customPrice: 0,
      discount: 0,
      quantity: 1,
      finalUnitPrice: 0,
      totalLinePrice: 0
    };
  };

  // Handle pricing changes from CartItemsWithPayment
  const handlePricingChange = (itemId, newPricing) => {
    setItemPricing(prev => ({
      ...prev,
      [itemId]: newPricing
    }));
  };

  // Handle employee changes from CartItemsWithPayment
  const handleEmployeeChange = (itemId, employeeId) => {
    setItemEmployees(prev => ({
      ...prev,
      [itemId]: employeeId
    }));
  };

  // Handle item remarks changes from CartItemsWithPayment
  const handleRemarksChange = (itemId, remarks) => {
    setItemRemarks(prev => ({
      ...prev,
      [itemId]: remarks
    }));
  };

  // Handle payment changes from CartItemsWithPayment
  const handlePaymentChange = (action, sectionId, data) => {
    setSectionPayments(prev => {
      const newState = { ...prev };
      
      switch (action) {
        case 'add':
          newState[sectionId] = [...(prev[sectionId] || []), data];
          break;
        case 'remove':
          newState[sectionId] = (prev[sectionId] || []).filter(payment => payment.id !== data);
          break;
        case 'updateAmount':
          newState[sectionId] = (prev[sectionId] || []).map(payment =>
            payment.id === data.paymentId
              ? { ...payment, amount: data.amount }
              : payment
          );
          break;
        case 'updateRemark':
          newState[sectionId] = (prev[sectionId] || []).map(payment =>
            payment.id === data.paymentId
              ? { ...payment, remark: data.remark }
              : payment
          );
          break;
        default:
          break;
      }
      
      return newState;
    });
  };

  // Handle selected payment method changes
  const handleSelectedPaymentMethodChange = (sectionId, methodId) => {
    setSelectedPaymentMethods(prev => ({
      ...prev,
      [sectionId]: methodId
    }));
  };

  // ✅ Enhanced validation function
  const isTransactionValid = () => {
    // Check transaction details validation from store
    const { isValid } = validateTransactionDetails();
    if (!isValid) return false;
    
    // Check basic transaction requirements
    const hasCartItems = cartItems.length > 0;
    
    // ✅ UPDATED: Check if ALL items have assigned employees (including products)
    const allItemsHaveEmployees = cartItems.every(item => 
      itemEmployees[item.id] // Now ALL items need employee assignment
    );
    
    // ✅ NEW: Check if Services & Products section is fully paid
    const servicesAndProducts = [
      ...cartItems.filter(item => item.type === 'service'),
      ...cartItems.filter(item => item.type === 'product')
    ];
    
    let servicesProductsFullyPaid = true;
    if (servicesAndProducts.length > 0) {
      const sectionTotal = servicesAndProducts.reduce((total, item) => {
        const pricing = getItemPricing(item.id);
        return total + pricing.totalLinePrice;
      }, 0);
      
      const sectionPaymentTotal = sectionPayments['services-products']?.reduce((total, payment) => 
        total + (payment.amount || 0), 0
      ) || 0;
      
      servicesProductsFullyPaid = Math.abs(sectionTotal - sectionPaymentTotal) < 0.01; // Allow for small rounding differences
    }
    
    // ✅ NEW: Check required transaction details
    const hasReceiptNumber = transactionDetails.receiptNumber && transactionDetails.receiptNumber.trim() !== '';
    const hasCreatedBy = transactionDetails.createdBy && transactionDetails.createdBy !== '';
    const hasHandledBy = transactionDetails.handledBy && transactionDetails.handledBy !== '';
    
    return hasCartItems && 
           allItemsHaveEmployees && 
           servicesProductsFullyPaid && 
           hasReceiptNumber && 
           hasCreatedBy && 
           hasHandledBy;
  };

  // ✅ NEW: Detailed validation function for better error messages
  const getValidationErrors = () => {
    const errors = [];
    
    // Check cart items
    if (cartItems.length === 0) {
      errors.push('Add items to your cart');
    }
    
    // Check required transaction details
    if (!transactionDetails.receiptNumber || transactionDetails.receiptNumber.trim() === '') {
      errors.push('Receipt number is required');
    }
    
    if (!transactionDetails.createdBy || transactionDetails.createdBy === '') {
      errors.push('Transaction creator must be selected');
    }
    
    if (!transactionDetails.handledBy || transactionDetails.handledBy === '') {
      errors.push('Transaction handler must be selected');
    }
    
    // ✅ UPDATED: Check employee assignments for ALL items
    const itemsNeedingEmployees = cartItems.filter(item => 
      !itemEmployees[item.id]
    );
    
    if (itemsNeedingEmployees.length > 0) {
      errors.push(`Assign employees to all items (${itemsNeedingEmployees.length} items missing employee assignment)`);
    }
    
    // ✅ NEW: Check Services & Products payment requirement
    const servicesAndProducts = [
      ...cartItems.filter(item => item.type === 'service'),
      ...cartItems.filter(item => item.type === 'product')
    ];
    
    if (servicesAndProducts.length > 0) {
      const sectionTotal = servicesAndProducts.reduce((total, item) => {
        const pricing = getItemPricing(item.id);
        return total + pricing.totalLinePrice;
      }, 0);
      
      const sectionPaymentTotal = sectionPayments['services-products']?.reduce((total, payment) => 
        total + (payment.amount || 0), 0
      ) || 0;
      
      const remainingAmount = sectionTotal - sectionPaymentTotal;
      
      if (Math.abs(remainingAmount) >= 0.01) { // Allow for small rounding differences
        errors.push(`Services & Products section must be fully paid (remaining: ${formatCurrency(remainingAmount)})`);
      }
    }
    
    return errors;
  };

  // ✅ Enhanced validation message component
  const ValidationMessage = () => {
    const validationErrors = getValidationErrors();
    
    if (validationErrors.length === 0) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        <h3 className="font-bold mb-2">❌ Cannot proceed with transaction:</h3>
        <ul className="list-disc pl-5 space-y-1">
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    });
  };
  
  // Handle confirm transaction
  const handleConfirmTransaction = async () => {
    if (!isTransactionValid()) {
      setModalMessage('Please ensure all transaction requirements are met before proceeding.');
      setShowModal(true);
      return;
    }
    
    try {
      // Group items by transaction type
      const groupedItems = {
        services: cartItems.filter(item => item.type === 'service'),
        products: cartItems.filter(item => item.type === 'product'),
        packages: cartItems.filter(item => item.type === 'package'),
        vouchers: cartItems.filter(item => item.type === 'member-voucher'),
        mcpTransfers: cartItems.filter(item => item.type === 'transferMCP' || (item.type === 'transfer' && item.data?.queueItem?.mcp_id1)),
        mvTransfers: cartItems.filter(item => item.type === 'transferMV'),
      };

      // Prepare transaction data - the store will handle transaction details automatically
      const transactionData = {
        // Services + Products combined transaction
        servicesProducts: (() => {
          const items = [...groupedItems.services, ...groupedItems.products];
          if (items.length === 0) return null;
          
          return {
            items: items.map(item => ({
              ...item,
              pricing: getItemPricing(item.id),
              assignedEmployee: itemEmployees[item.id] || null,
              remarks: itemRemarks[item.id] || ''
            })),
            payments: sectionPayments['services-products'] || []
          };
        })(),
        
        // Individual MCP transactions
        mcpTransactions: groupedItems.packages.map(pkg => ({
          item: {
            ...pkg,
            pricing: getItemPricing(pkg.id),
            assignedEmployee: itemEmployees[pkg.id] || null,
            remarks: itemRemarks[pkg.id] || ''
          },
          payments: sectionPayments[`package-${pkg.id}`] || []
        })),
        
        // Individual MV transactions
        mvTransactions: groupedItems.vouchers.map(voucher => ({
          item: {
            ...voucher,
            pricing: getItemPricing(voucher.id),
            assignedEmployee: itemEmployees[voucher.id] || null,
            remarks: itemRemarks[voucher.id] || ''
          },
          payments: sectionPayments[`voucher-${voucher.id}`] || []
        }))
      };

      console.log('📋 Prepared transaction data:', transactionData);
      console.log('📋 Transaction details from store:', transactionDetails);

      // Create transactions using the store (transaction details are handled automatically)
      const result = await createSaleTransactions(transactionData);
      
      if (result.success) {
        if (result.hasPartialSuccess) {
          setModalMessage(`Partial success: ${result.createdTransactions.length} transactions created, ${result.failedTransactions.length} failed. Check the details below.`);
        } else {
          setModalMessage('All transactions completed successfully!');
        }
        setShowModal(true);
        
        // Clear cart after successful transaction creation
        clearCart();
        
        // Navigate after a delay to show results
        setTimeout(() => {
          resetTransactionStore();
          navigate('/sale-transaction');
        }, 3000);
      } else {
        setModalMessage(`Transaction creation failed: ${result.error || 'Unknown error'}`);
        setShowModal(true);
      }
      
    } catch (error) {
      console.error('💥 Error in transaction creation:', error);
      setModalMessage(`Unexpected error: ${error.message}`);
      setShowModal(true);
    }
  };
  
  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className="max-w-[1600px] mx-auto p-4 space-y-6">
              
              {/* Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Transaction Summary</CardTitle>
                    <Button 
                      onClick={() => navigate(-1)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={isCreating}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Review and complete your transaction</p>
                      
                      {!selectedMember && (
                        <div className="mt-2 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full inline-block">
                          No member selected (Walk-in customer)
                        </div>
                      )}
                      
                      {selectedMember && (
                        <div className="mt-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full inline-block">
                          Member: {selectedMember.name}
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full inline-block">
                        Items in cart: {cartItems.length}
                      </div>
                      
                      <div className="mt-2 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full inline-block">
                        Total: {formatCurrency(getUpdatedCartTotal())}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Progress Display */}
              {(isCreating || currentStep === 'completed' || currentStep === 'failed' || currentStep === 'partial') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isCreating && <Clock className="h-5 w-5 animate-spin" />}
                      {currentStep === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {(currentStep === 'failed' || currentStep === 'partial') && <XCircle className="h-5 w-5 text-red-600" />}
                      Transaction Creation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      {progress.total > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.completed + progress.failed} / {progress.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${((progress.completed + progress.failed) / progress.total) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">{progress.currentOperation}</p>
                        </div>
                      )}

                      {/* Results Summary */}
                      {(currentStep === 'completed' || currentStep === 'failed' || currentStep === 'partial') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{createdTransactions.length}</div>
                            <div className="text-sm text-green-700">Successful</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{failedTransactions.length}</div>
                            <div className="text-sm text-red-700">Failed</div>
                          </div>
                        </div>
                      )}

                      {/* Error Messages */}
                      {errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-600">Errors:</h4>
                          <ul className="space-y-1">
                            {errors.map((error, index) => (
                              <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Successful Transactions */}
                      {createdTransactions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-600">Created Transactions:</h4>
                          <ul className="space-y-1">
                            {createdTransactions.map((txn, index) => (
                              <li key={index} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                {txn.type.toUpperCase()}: Transaction ID {txn.transaction?.id || 'N/A'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Debug Panel - Sale Transaction Data Only */}
              {showDebug && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-blue-800">🐛 Debug: Sale Transaction Data</CardTitle>
                      <Button 
                        onClick={() => setShowDebug(!showDebug)}
                        variant="outline" 
                        size="sm"
                      >
                        Hide Debug
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Prepared Transaction Data Preview */}
                    <div className="bg-white p-3 rounded border">
                      <h4 className="font-semibold text-sm mb-2 text-teal-700">📤 Prepared Sale Transaction Data</h4>
                      <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-2 rounded">
                        {JSON.stringify({
                          // Transaction Details (from store)
                          transactionDetails: {
                            receiptNumber: transactionDetails.receiptNumber,
                            transactionRemark: transactionDetails.transactionRemark,
                            createdBy: transactionDetails.createdBy,
                            handledBy: transactionDetails.handledBy,
                            memberId: transactionDetails.memberId,
                            customerType: transactionDetails.customerType
                          },
                          // Transaction Data
                          servicesProducts: (() => {
                            const groupedItems = {
                              services: cartItems.filter(item => item.type === 'service'),
                              products: cartItems.filter(item => item.type === 'product'),
                            };
                            const items = [...groupedItems.services, ...groupedItems.products];
                            return items.length === 0 ? null : {
                              items: items.map(item => ({
                                ...item,
                                pricing: getItemPricing(item.id),
                                assignedEmployee: itemEmployees[item.id] || null,
                                remarks: itemRemarks[item.id] || ''
                              })),
                              payments: sectionPayments['services-products'] || []
                            };
                          })(),
                          mcpTransactions: cartItems.filter(item => item.type === 'package').map(pkg => ({
                            item: {
                              ...pkg,
                              pricing: getItemPricing(pkg.id),
                              assignedEmployee: itemEmployees[pkg.id] || null,
                              remarks: itemRemarks[pkg.id] || ''
                            },
                            payments: sectionPayments[`package-${pkg.id}`] || []
                          })),
                          mvTransactions: cartItems.filter(item => item.type === 'member-voucher').map(voucher => ({
                            item: {
                              ...voucher,
                              pricing: getItemPricing(voucher.id),
                              assignedEmployee: itemEmployees[voucher.id] || null,
                              remarks: itemRemarks[voucher.id] || ''
                            },
                            payments: sectionPayments[`voucher-${voucher.id}`] || []
                          }))
                        }, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Debug Toggle Button (when debug is hidden) */}
              {!showDebug && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setShowDebug(true)}
                    variant="outline" 
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    🐛 Show Debug Info
                  </Button>
                </div>
              )}
              
              {/* ✅ Enhanced Transaction Information - Using Store Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="receiptNumber"
                        type="text"
                        value={transactionDetails.receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        disabled={isCreating}
                        className={`w-full p-2 border rounded-md disabled:bg-gray-100 ${
                          !transactionDetails.receiptNumber || transactionDetails.receiptNumber.trim() === ''
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        placeholder="Enter receipt number (required)"
                        required
                      />
                      {(!transactionDetails.receiptNumber || transactionDetails.receiptNumber.trim() === '') && (
                        <p className="text-red-500 text-xs mt-1">Receipt number is required</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="transactionRemark" className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Remark
                      </label>
                      <textarea
                        id="transactionRemark"
                        value={transactionDetails.transactionRemark}
                        onChange={(e) => setTransactionRemark(e.target.value)}
                        disabled={isCreating}
                        className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 focus:border-blue-500 focus:ring-blue-200"
                        placeholder="Enter transaction remark (optional)"
                        rows={1}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`${
                      !transactionDetails.createdBy || transactionDetails.createdBy === ''
                        ? 'ring-2 ring-red-200 rounded-md p-2' 
                        : ''
                    }`}>
                      <EmployeeSelect 
                        label="Transaction Creator *"
                        value={transactionDetails.createdBy || ""}
                        onChange={setCreatedBy}
                        disabled={isCreating}
                        errors={{}}
                      />
                      {(!transactionDetails.createdBy || transactionDetails.createdBy === '') && (
                        <p className="text-red-500 text-xs mt-1">Transaction creator is required</p>
                      )}
                    </div>
                    
                    <div className={`${
                      !transactionDetails.handledBy || transactionDetails.handledBy === ''
                        ? 'ring-2 ring-red-200 rounded-md p-2' 
                        : ''
                    }`}>
                      <EmployeeSelect 
                        label="Transaction Handler *"
                        value={transactionDetails.handledBy || ""}
                        onChange={setHandledBy}
                        disabled={isCreating}
                        errors={{}}
                      />
                      {(!transactionDetails.handledBy || transactionDetails.handledBy === '') && (
                        <p className="text-red-500 text-xs mt-1">Transaction handler is required</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Transaction Details Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Customer Type:</span>
                        <span className="ml-2 font-medium">{transactionDetails.customerType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Member ID:</span>
                        <span className="ml-2 font-medium">{transactionDetails.memberId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Cart Items with Payment */}
              {cartItems.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-gray-600">Your cart is empty</p>
                      <p className="text-sm text-gray-500 mt-1">Add some items to continue</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => navigate('/sale-transaction/new')}
                        disabled={isCreating}
                      >
                        Add Items
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CartItemsWithPayment
                  cartItems={cartItems}
                  onPricingChange={handlePricingChange}
                  onEmployeeChange={handleEmployeeChange}
                  onRemarksChange={handleRemarksChange}
                  onPaymentChange={handlePaymentChange}
                  onSelectedPaymentMethodChange={handleSelectedPaymentMethodChange}
                  itemEmployees={itemEmployees}
                  itemPricing={itemPricing}
                  itemRemarks={itemRemarks}
                  sectionPayments={sectionPayments}
                  selectedPaymentMethods={selectedPaymentMethods}
                  disabled={isCreating}
                />
              )}
              
              {/* Transaction Actions */}
              {cartItems.length > 0 && (
                <>
                  {/* ✅ Enhanced Validation Message */}
                  {!isTransactionValid() && !isCreating && <ValidationMessage />}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={isCreating}
                    >
                      Go Back
                    </Button>
                    <Button
                      disabled={!isTransactionValid() || isCreating}
                      onClick={handleConfirmTransaction}
                      className={(!isTransactionValid() || isCreating) ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isCreating ? 'Creating Transactions...' : 'Complete Transaction'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Modal for messages */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-lg mb-2">Transaction Status</h3>
            <p className="text-slate-600 mb-4">{modalMessage}</p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleTransactionSummary;