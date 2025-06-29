import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, CreditCard, Package, RefreshCcw, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import api from '@/services/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import useProceedPaymentStore from '@/stores/SaleTransaction/useProceedPaymentStore';

const ProcessPaymentSaleTransaction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Payment method store
    const dropdownPaymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
    const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);
    
    // Proceed payment store - UPDATED to include transaction handler
    const {
        // State
        transaction,
        loading,
        error,
        processing,
        newPayments,
        selectedPaymentMethod,
        paymentHandlerId,
        transactionHandlerId, // NEW: Added transaction handler
        generalRemark,
        createdAt, // RESTORED: Added creation date
        PENDING_PAYMENT_METHOD_ID,
        
        // Actions
        setTransaction,
        setLoading,
        setError,
        setProcessing,
        setSelectedPaymentMethod,
        setPaymentHandlerId,
        setTransactionHandlerId, // NEW: Added transaction handler setter
        setGeneralRemark,
        setCreatedAt, // RESTORED: Added creation date setter
        addPayment,
        removePayment,
        updatePaymentAmount,
        updatePaymentRemark,
        
        // Calculated values
        getOutstandingAmount,
        getNewPaymentsTotal,
        getRemainingOutstanding,
        getUpdatedPendingAmount,
        isValidForProcessing,
        
        // Utils
        reset
    } = useProceedPaymentStore();

    // Load data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🚀 Fetching transaction data for ID:', id);

                // Fetch transaction details
                const transactionResponse = await api.get(`/st/list/${id}`);
                
                if (!transactionResponse.data?.success) {
                    throw new Error('Failed to fetch transaction data');
                }

                const transactionData = transactionResponse.data.data;
                setTransaction(transactionData); // This will auto-set transaction handler in updated store

                console.log('✅ Transaction data loaded:', transactionData);

                // Initialize creation date to current time if not set
                if (!transactionData.createdAt) {
                    setCreatedAt(new Date().toISOString().slice(0, 16));
                }

                // Load payment methods if not already loaded
                if (dropdownPaymentMethods.length === 0) {
                    console.log('📄 Loading payment methods...');
                    await fetchDropdownPaymentMethods();
                }
                
                console.log('✅ Payment methods loaded:', dropdownPaymentMethods.length);

            } catch (err) {
                console.error("❌ Error fetching data:", err);
                setError(err.message || 'Failed to fetch transaction data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }

        // Cleanup function
        return () => {
            console.log('🧹 Component unmounting, resetting store...');
            reset();
        };
    }, [id, dropdownPaymentMethods.length, fetchDropdownPaymentMethods, setTransaction, setLoading, setError, reset]);

    // Add new payment method
    const handleAddPaymentMethod = () => {
        console.log('🎯 ADD PAYMENT METHOD CALLED');
        
        if (!selectedPaymentMethod) {
            alert('Please select a payment method first');
            return;
        }

        const selectedId = selectedPaymentMethod.toString();

        // Don't allow manual addition of pending payment method
        if (selectedId === PENDING_PAYMENT_METHOD_ID.toString()) {
            alert('Pending payment method is auto-managed and cannot be added manually');
            setSelectedPaymentMethod('');
            return;
        }

        // Find the method from the available payment methods
        const method = dropdownPaymentMethods.find(m => m.id === selectedId);
        
        if (!method) {
            alert(`Payment method with ID ${selectedId} not found. Please try again.`);
            return;
        }

        const newPayment = {
            id: Date.now(),
            methodId: selectedId,
            methodName: method.payment_method_name,
            amount: 0,
            remark: ''
        };

        console.log('✅ Creating new payment:', newPayment);
        addPayment(newPayment);
    };

    // Update payment amount with validation
    const handleUpdatePaymentAmount = (paymentId, amount) => {
        const numAmount = parseFloat(amount) || 0;
        
        // Calculate total of other payments
        const otherPaymentsTotal = newPayments
            .filter(p => p.id !== paymentId)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        // Calculate maximum allowed for this payment
        const maxAllowed = getOutstandingAmount() - otherPaymentsTotal;
        const clampedAmount = Math.min(numAmount, Math.max(0, maxAllowed));

        // Show warning if amount was adjusted
        if (numAmount > maxAllowed && maxAllowed >= 0) {
            console.warn(`⚠️ Payment amount adjusted from ${numAmount} to ${clampedAmount}`);
        }

        updatePaymentAmount(paymentId, clampedAmount);
    };

    // Process payment - UPDATED TO USE NEW ENDPOINT
    const handleProcessPayment = async () => {
        const validation = isValidForProcessing();
        
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        try {
            setProcessing(true);

            // Prepare payments including auto-updated pending payment
            const allPayments = [...newPayments];
            const pendingAmount = getUpdatedPendingAmount();
            
            if (pendingAmount > 0) {
                // Add/update pending payment
                allPayments.push({
                    id: Date.now() + 1,
                    methodId: PENDING_PAYMENT_METHOD_ID,
                    methodName: 'Pending',
                    amount: pendingAmount,
                    remark: 'Auto-updated pending payment for remaining outstanding amount'
                });
            }

            console.log('🔄 Processing payments:', allPayments);

            // UPDATED: Prepare payment data in the format expected by processPartialPayment
            const paymentData = {
                payments: allPayments.map(payment => ({
                    payment_method_id: parseInt(payment.methodId),
                    amount: parseFloat(payment.amount),
                    remarks: payment.remark || '',
                    payment_handler_id: parseInt(paymentHandlerId)
                })),
                general_remarks: generalRemark || '',
                transaction_handler_id: parseInt(transactionHandlerId), // Use the selected transaction handler
                created_at: createdAt // RESTORED: Include custom creation date
            };

            console.log('📤 Sending payment data to /st/pp/' + id + ':', paymentData);

            // UPDATED: Call the correct endpoint with transaction ID in the URL
            const response = await api.post(`/st/pp/${id}`, paymentData);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to process payment');
            }

            console.log('✅ Payment processed successfully:', response.data);
            alert('Payment processed successfully!');
            navigate('/sale-transaction/list');

        } catch (err) {
            console.error('❌ Error processing payment:', err);
            alert(err.response?.data?.message || err.message || 'Failed to process payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2
        });
    };

    // Loading state
    if (loading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <div className="text-gray-600">Loading transaction details...</div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    // Error state
    if (error) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center p-8">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <div className="text-red-500 text-xl mb-2">Error</div>
                            <div className="text-gray-600 mb-6">{error}</div>
                            <Button onClick={() => window.location.reload()}>Try Again</Button>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    // Transaction not found
    if (!transaction) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center p-8">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <div className="text-gray-600 text-xl mb-2">Transaction not found</div>
                            <div className="text-gray-500 mb-6">The requested transaction could not be found</div>
                            <Button onClick={() => navigate('/sale-transaction/list')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Transactions
                            </Button>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    {/* Debug Panel */}
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <h3 className="font-bold text-yellow-800 mb-2">🐛 Debug Information</h3>
                        <div className="text-sm space-y-1">
                            <div><strong>Selected Payment Method:</strong> {selectedPaymentMethod || 'None'} (type: {typeof selectedPaymentMethod})</div>
                            <div><strong>Payment Handler ID:</strong> {paymentHandlerId || 'None'}</div>
                            <div><strong>Transaction Handler ID:</strong> {transactionHandlerId || 'None'}</div>
                            <div><strong>Creation Date:</strong> {createdAt || 'None'}</div>
                            <div><strong>New Payments Count:</strong> {newPayments.length}</div>
                            <div><strong>Payment Methods Available:</strong> {dropdownPaymentMethods.length}</div>
                            <div><strong>Transaction Loaded:</strong> {transaction ? 'Yes' : 'No'}</div>
                            <div><strong>Store Path:</strong> useProceedPaymentStore from @/stores/SaleTransaction/useProceedPaymentStore</div>
                            <div><strong>PENDING_PAYMENT_METHOD_ID:</strong> {PENDING_PAYMENT_METHOD_ID} (type: {typeof PENDING_PAYMENT_METHOD_ID})</div>
                            <div><strong>API Endpoint:</strong> /st/pp/{id}</div>
                        </div>
                        
                        {/* Payment Methods Debug */}
                        <div className="mt-3">
                            <strong>Available Payment Methods:</strong>
                            <div className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-32 overflow-auto">
                                {dropdownPaymentMethods.length > 0 ? (
                                    dropdownPaymentMethods.map((pm, index) => (
                                        <div key={index} className="mb-1">
                                            ID: {pm.id} ({typeof pm.id}) - Name: {pm.payment_method_name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No payment methods loaded</div>
                                )}
                            </div>
                        </div>

                        {/* Store State Debug */}
                        <div className="mt-3">
                            <strong>Store State:</strong>
                            <div className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-40 overflow-auto">
                                <div><strong>newPayments.length:</strong> {newPayments.length}</div>
                                <div><strong>selectedPaymentMethod:</strong> "{selectedPaymentMethod}" ({typeof selectedPaymentMethod})</div>
                                <div><strong>paymentHandlerId:</strong> "{paymentHandlerId}" ({typeof paymentHandlerId})</div>
                                <div><strong>transactionHandlerId:</strong> "{transactionHandlerId}" ({typeof transactionHandlerId})</div>
                                <div><strong>createdAt:</strong> "{createdAt}" ({typeof createdAt})</div>
                                <div><strong>processing:</strong> {processing.toString()}</div>
                                <div><strong>loading:</strong> {loading.toString()}</div>
                                <div><strong>error:</strong> {error || 'null'}</div>
                            </div>
                        </div>

                        {newPayments.length > 0 && (
                            <div className="mt-3">
                                <strong>Current Payments in Store:</strong>
                                <div className="text-xs bg-green-100 p-2 rounded mt-1 max-h-32 overflow-auto">
                                    {newPayments.map((payment, index) => (
                                        <div key={index} className="mb-2 p-1 border-b border-green-200">
                                            <div><strong>#{index + 1}:</strong> {payment.methodName}</div>
                                            <div>ID: {payment.id}, Method ID: {payment.methodId}, Amount: {payment.amount}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Test Buttons */}
                        <div className="mt-3 space-x-2">
                            <button 
                                onClick={() => {
                                    console.log('🔍 Manual Debug - Full Store State:');
                                    console.log('newPayments:', newPayments);
                                    console.log('selectedPaymentMethod:', selectedPaymentMethod);
                                    console.log('paymentHandlerId:', paymentHandlerId);
                                    console.log('transactionHandlerId:', transactionHandlerId);
                                    console.log('createdAt:', createdAt);
                                    console.log('dropdownPaymentMethods:', dropdownPaymentMethods);
                                }}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                            >
                                Log Store State
                            </button>
                            <button 
                                onClick={() => {
                                    const testPayment = {
                                        id: Date.now(),
                                        methodId: '1',
                                        methodName: 'Test Payment',
                                        amount: 10,
                                        remark: 'Test'
                                    };
                                    console.log('🧪 Test: Adding payment directly:', testPayment);
                                    addPayment(testPayment);
                                }}
                                className="px-2 py-1 bg-green-500 text-white text-xs rounded"
                            >
                                Test Add Payment
                            </button>
                            <button 
                                onClick={() => {
                                    const testData = {
                                        payments: [{
                                            payment_method_id: 1,
                                            amount: 50,
                                            remarks: 'Test payment',
                                            payment_handler_id: parseInt(paymentHandlerId) || 1
                                        }],
                                        general_remarks: 'Test transaction',
                                        transaction_handler_id: parseInt(transactionHandlerId) || 1,
                                        created_at: createdAt || new Date().toISOString().slice(0, 16)
                                    };
                                    console.log('🧪 Test: Payment data format for /st/pp/:id:', testData);
                                }}
                                className="px-2 py-1 bg-purple-500 text-white text-xs rounded"
                            >
                                Test API Format
                            </button>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button 
                                variant="outline" 
                                onClick={() => navigate('/sale-transaction/list')}
                                className="flex items-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Transactions
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Process Payment</h1>
                                <p className="text-muted-foreground">
                                    Complete payment for transaction #{transaction.transaction_id}
                                </p>
                            </div>
                        </div>
                        <Badge variant={transaction.transaction_status === 'PARTIAL' ? 'destructive' : 'default'}>
                            {transaction.transaction_status === 'PARTIAL' ? 'Partially Paid' : transaction.transaction_status}
                        </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Transaction Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Package className="h-5 w-5 mr-2" />
                                    Transaction Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm text-gray-500">Receipt No</Label>
                                        <p className="font-medium">{transaction.receipt_no}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-500">Date</Label>
                                        <p className="font-medium">
                                            {new Date(transaction.transaction_created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-500">Customer Type</Label>
                                        <p className="font-medium">{transaction.customer_type}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-500">Member</Label>
                                        <p className="font-medium">
                                            {transaction.member?.name || 'Walk-in Customer'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-500">Original Handler</Label>
                                        <p className="font-medium">
                                            {transaction.handler?.name || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Payment Summary */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Payment Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="font-medium">
                                                {formatCurrency(transaction.total_transaction_amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Already Paid:</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(transaction.total_paid_amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                            <span className="text-gray-600 font-medium">Outstanding:</span>
                                            <span className="font-bold text-red-600">
                                                {formatCurrency(getOutstandingAmount())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Processing */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    Add New Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* NEW: Transaction Handler Selection */}
                                <div>
                                    <Label>Transaction Handler *</Label>
                                    <EmployeeSelect
                                        value={transactionHandlerId}
                                        onChange={(handlerId) => {
                                            console.log('🧑‍💼 Transaction handler changed:', handlerId);
                                            setTransactionHandlerId(handlerId);
                                        }}
                                        errors={{}}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Employee who will handle the new transaction (auto-filled from original transaction)
                                    </p>
                                </div>

                                {/* Payment Handler Selection */}
                                <div>
                                    <Label>Payment Handler *</Label>
                                    <EmployeeSelect
                                        value={paymentHandlerId}
                                        onChange={(handlerId) => {
                                            console.log('🧑‍💼 Payment handler changed:', handlerId);
                                            setPaymentHandlerId(handlerId);
                                        }}
                                        errors={{}}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Employee who processed the payment
                                    </p>
                                </div>

                                {/* Add Payment Method */}
                                <div>
                                    <Label>Add Payment Method</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <PaymentMethodSelect
                                                value={selectedPaymentMethod}
                                                onChange={(methodId) => {
                                                    console.log('💳 PaymentMethodSelect onChange:', methodId, typeof methodId);
                                                    setSelectedPaymentMethod(methodId);
                                                }}
                                                errors={{}}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddPaymentMethod}
                                            disabled={!selectedPaymentMethod}
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Payment Methods List */}
                                <div>
                                    <Label>Added Payment Methods ({newPayments.length})</Label>
                                    {newPayments.length === 0 ? (
                                        <div className="text-gray-500 text-sm italic p-4 border border-dashed rounded-lg">
                                            No payment methods added yet. Select a payment method and click Add.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {newPayments.map((payment) => (
                                                <div key={payment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                                    <div className="flex-shrink-0 w-24">
                                                        <span className="text-sm font-medium">{payment.methodName}</span>
                                                        <div className="text-xs text-gray-500">ID: {payment.methodId}</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="Amount"
                                                            value={payment.amount || ''}
                                                            onChange={(e) => handleUpdatePaymentAmount(payment.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input
                                                            type="text"
                                                            placeholder="Remark"
                                                            value={payment.remark}
                                                            onChange={(e) => updatePaymentRemark(payment.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            console.log('🗑️ Removing payment:', payment.id);
                                                            removePayment(payment.id);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* General Remark */}
                                <div>
                                    <Label>New Transaction Remark</Label>
                                    <Textarea
                                        placeholder="Enter general remark for all payments..."
                                        value={generalRemark}
                                        onChange={(e) => setGeneralRemark(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                {/* RESTORED: Creation Date & Time */}
                                <div className="space-y-1">
                                    <Label htmlFor="created_at" className="text-sm font-medium pb-1 text-gray-700">
                                        Creation date & time *
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        id="created_at"
                                        value={
                                            createdAt || new Date().toISOString().slice(0, 16)
                                        }
                                        onChange={(e) => {
                                            const newValue = e.target.value || new Date().toISOString().slice(0, 16);
                                            setCreatedAt(newValue);
                                        }}
                                        step="1"
                                        className="rounded-md"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Date and time for the new transaction
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Summary & Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="h-5 w-5 mr-2" />
                                Payment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Outstanding Amount:</span>
                                        <span className="font-medium">{formatCurrency(getOutstandingAmount())}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">New Payments Total:</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(getNewPaymentsTotal())}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600 font-medium">Remaining Outstanding:</span>
                                        <span className={`font-bold ${getRemainingOutstanding() > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {formatCurrency(getRemainingOutstanding())}
                                        </span>
                                    </div>
                                    {getRemainingOutstanding() > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-orange-600">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>A pending payment of {formatCurrency(getRemainingOutstanding())} will be auto-created</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-end">
                                    <Button
                                        onClick={handleProcessPayment}
                                        disabled={processing || newPayments.length === 0 || !paymentHandlerId || !transactionHandlerId || !createdAt}
                                        size="lg"
                                        className="w-full md:w-auto"
                                    >
                                        {processing ? (
                                            <>
                                                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Process Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default ProcessPaymentSaleTransaction;