import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import CartItemsWithPayment from './CartItemsWithPayment';

const SaleTransactionSummary = () => {
  const navigate = useNavigate();
  
  // Get cart data from store
  const { selectedMember, cartItems, clearCart } = useTransactionCartStore();
  
  // State for transaction details ONLY
  const [transactionNumber, setTransactionNumber] = useState('');
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
    
    // Check if required sections have payment (delegate to child component validation)
    // This is simplified - the child component will handle payment validation
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
      // Flatten all payments
      const allPayments = [];
      Object.entries(sectionPayments).forEach(([sectionId, payments]) => {
        payments.forEach(payment => {
          if (payment.amount > 0) {
            allPayments.push({
              methodId: payment.methodId,
              methodName: payment.methodName,
              amount: payment.amount,
              remark: payment.remark,
              sectionId
            });
          }
        });
      });

      // Create the transaction payload
      const payload = {
        transactionNumber,
        transactionRemark,
        member: selectedMember,
        handlers: {
          transaction: transactionHandlerId,
          payment: paymentHandlerId
        },
        items: cartItems.map(item => ({
          ...item,
          employee_id: itemEmployees[item.id] || null,
          pricing: getItemPricing(item.id) 
        })),
        payments: allPayments,
        totals: {
          totalPayable: getUpdatedCartTotal(),
          totalPaid: allPayments.reduce((sum, p) => sum + p.amount, 0)
        }
      };
      
      // Submit transaction
      const response = await api.post('/transactions', payload);
      
      if (response.data && response.data.success) {
        setModalMessage('Transaction completed successfully!');
        setShowModal(true);
        clearCart();
        setTimeout(() => {
          navigate('/sale-transaction');
        }, 1500);
      } else {
        throw new Error(response.data?.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setModalMessage(`Transaction failed: ${error.message}`);
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
              
              {/* Transaction Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="transactionNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Number (Optional)
                      </label>
                      <input
                        id="transactionNumber"
                        type="text"
                        value={transactionNumber}
                        onChange={(e) => setTransactionNumber(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter manual transaction number"
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
                        className="w-full p-2 border border-gray-300 rounded-md"
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
                        errors={{}}
                      />
                    </div>
                    
                    <div>
                      <EmployeeSelect 
                        label="Payment Handler *"
                        value={paymentHandlerId}
                        onChange={setPaymentHandlerId}
                        errors={{}}
                      />
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
                />
              )}
              
              {/* Transaction Actions */}
              {cartItems.length > 0 && (
                <>
                  {/* Validation Message */}
                  {!isTransactionValid() && (
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
                    >
                      Go Back
                    </Button>
                    <Button
                      disabled={!isTransactionValid()}
                      onClick={handleConfirmTransaction}
                      className={!isTransactionValid() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Complete Transaction
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
            <h3 className="font-semibold text-lg mb-2">Transaction Message</h3>
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