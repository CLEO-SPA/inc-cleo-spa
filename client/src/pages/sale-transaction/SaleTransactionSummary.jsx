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
  
  // Get sale transaction store
  const { 
    isCreating, 
    currentStep, 
    progress, 
    createdTransactions,
    failedTransactions,
    errors,
    createSaleTransactions,
    reset: resetTransactionStore
  } = useSaleTransactionStore();
  
  // State for transaction details ONLY
  const [ReceiptNumber, setReceiptNumber] = useState('');
  const [transactionRemark, setTransactionRemark] = useState('');
  const [transactionHandlerId, setTransactionHandlerId] = useState('');
  const [paymentHandlerId, setPaymentHandlerId] = useState('');
  
  // State for cart items and payments (managed by child component)
  const [itemEmployees, setItemEmployees] = useState({});
  const [itemPricing, setItemPricing] = useState({});
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState({});
  const [sectionPayments, setSectionPayments] = useState({});
  
  // Modal state
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Get cart total (uses pricing data)
  const getUpdatedCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const pricing = getItemPricing(item.id);
      return total + pricing.totalLinePrice;
    }, 0);
  };

  // Initialize itemEmployees and itemPricing with any existing assignments
  useEffect(() => {
    const initialAssignments = {};
    const initialPricing = {};
    
    cartItems.forEach(item => {
      if (item.data?.employee_id) {
        initialAssignments[item.id] = item.data.employee_id;
      }
      
      // Initialize pricing data for each item
      const originalPrice = item.data?.price || item.data?.total_price || 0;
      const quantity = item.data?.quantity || 1;
      
      initialPricing[item.id] = {
        originalPrice: originalPrice,
        customPrice: 0,
        discount: 0,
        quantity: quantity,
        finalUnitPrice: originalPrice,
        totalLinePrice: originalPrice * quantity
      };
    });
    
    setItemEmployees(initialAssignments);
    setItemPricing(initialPricing);
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

  // Check if transaction is valid for submission
  const isTransactionValid = () => {
    // Check basic transaction requirements
    const hasTransactionHandler = Boolean(transactionHandlerId);
    const hasPaymentHandler = Boolean(paymentHandlerId);
    const hasCartItems = cartItems.length > 0;
    
    // Check if all required items have assigned employees
    const allItemsHaveEmployees = cartItems.every(item => 
      item.type === 'product' || 
      item.type === 'member-voucher' || 
      itemEmployees[item.id]
    );
    
    // Check if required sections have payment
    const hasPayments = Object.values(sectionPayments).some(payments => 
      Array.isArray(payments) && payments.length > 0
    );
    
    return hasTransactionHandler && hasPaymentHandler && hasCartItems && allItemsHaveEmployees && hasPayments;
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
      };

      // Prepare transaction data
      const transactionData = {
        member: selectedMember,
        handlers: {
          transaction: transactionHandlerId,
          payment: paymentHandlerId
        },
        ReceiptNumber,
        transactionRemark,
        
        // Services + Products combined transaction
        servicesProducts: (() => {
          const items = [...groupedItems.services, ...groupedItems.products];
          if (items.length === 0) return null;
          
          return {
            items: items.map(item => ({
              ...item,
              pricing: getItemPricing(item.id),
              employee_id: itemEmployees[item.id] || null
            })),
            payments: sectionPayments['services-products'] || [],
            totalAmount: items.reduce((total, item) => {
              const pricing = getItemPricing(item.id);
              return total + pricing.totalLinePrice;
            }, 0)
          };
        })(),
        
        // Individual MCP transactions
        mcpTransactions: groupedItems.packages.map(pkg => ({
          item: {
            ...pkg,
            pricing: getItemPricing(pkg.id),
            employee_id: itemEmployees[pkg.id] || null
          },
          payments: sectionPayments[`package-${pkg.id}`] || [],
          totalAmount: getItemPricing(pkg.id).totalLinePrice
        })),
        
        // Individual MV transactions
        mvTransactions: groupedItems.vouchers.map(voucher => ({
          item: {
            ...voucher,
            pricing: getItemPricing(voucher.id),
            employee_id: itemEmployees[voucher.id] || null
          },
          payments: sectionPayments[`voucher-${voucher.id}`] || [],
          totalAmount: getItemPricing(voucher.id).totalLinePrice
        }))
      };

      console.log('📋 Prepared transaction data:', transactionData);

      // Create transactions using the store
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
                          No member selected
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
              
              {/* Transaction Information - ONLY TRANSACTION DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt Number (Required)
                      </label>
                      <input
                        id="ReceiptNumber"
                        type="text"
                        value={ReceiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        disabled={isCreating}
                        className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                        placeholder="Enter manual Receipt Number number"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="transactionRemark" className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Remark
                      </label>
                      <textarea
                        id="transactionRemark"
                        value={transactionRemark}
                        onChange={(e) => setTransactionRemark(e.target.value)}
                        disabled={isCreating}
                        className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                        placeholder="Enter transaction remark"
                        rows={1}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <EmployeeSelect 
                        label="Transaction Handler *"
                        value={transactionHandlerId}
                        onChange={setTransactionHandlerId}
                        disabled={isCreating}
                        errors={{}}
                      />
                    </div>
                    
                    <div>
                      <EmployeeSelect 
                        label="Payment Handler *"
                        value={paymentHandlerId}
                        onChange={setPaymentHandlerId}
                        disabled={isCreating}
                        errors={{}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Cart Items with Payment - DELEGATED TO COMPONENT */}
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
                  onPaymentChange={handlePaymentChange}
                  onSelectedPaymentMethodChange={handleSelectedPaymentMethodChange}
                  itemEmployees={itemEmployees}
                  itemPricing={itemPricing}
                  sectionPayments={sectionPayments}
                  selectedPaymentMethods={selectedPaymentMethods}
                  disabled={isCreating}
                />
              )}
              
              {/* Transaction Actions */}
              {cartItems.length > 0 && (
                <>
                  {/* Validation Message */}
                  {!isTransactionValid() && !isCreating && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                      <h3 className="font-bold">Before proceeding, please ensure:</h3>
                      <ul className="list-disc pl-5 mt-2">
                        {!transactionHandlerId && <li>Transaction handler is selected</li>}
                        {!paymentHandlerId && <li>Payment handler is selected</li>}
                        <li>All required sections have appropriate payments</li>
                        <li>All services and packages have assigned employees</li>
                      </ul>
                    </div>
                  )}
                  
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