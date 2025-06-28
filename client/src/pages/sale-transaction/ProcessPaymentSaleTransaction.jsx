import React, { useState, useEffect } from 'react';
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

const ProcessPaymentSaleTransaction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State management
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    // Payment processing state
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newPayments, setNewPayments] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [paymentHandlerId, setPaymentHandlerId] = useState('');
    const [generalRemark, setGeneralRemark] = useState('');
    
    // Payment method store
    const dropdownPaymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
    const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);

    // Constants
    const PENDING_PAYMENT_METHOD_ID = 7;

    // Load data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching transaction data for ID:', id);

                // Fetch transaction details
                const transactionResponse = await api.get(`/st/list/${id}`);
                
                if (!transactionResponse.data?.success) {
                    throw new Error('Failed to fetch transaction data');
                }

                const transactionData = transactionResponse.data.data;
                setTransaction(transactionData);

                console.log('Transaction data:', transactionData);

                // Load payment methods if not already loaded
                if (dropdownPaymentMethods.length === 0) {
                    await fetchDropdownPaymentMethods();
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || 'Failed to fetch transaction data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, dropdownPaymentMethods.length, fetchDropdownPaymentMethods]);

    // Calculate outstanding amount
    const getOutstandingAmount = () => {
        if (!transaction) return 0;
        return parseFloat(transaction.outstanding_total_payment_amount || 0);
    };

    // Calculate new payments total
    const getNewPaymentsTotal = () => {
        return newPayments.reduce((total, payment) => total + (parseFloat(payment.amount) || 0), 0);
    };

    // Calculate remaining outstanding after new payments
    const getRemainingOutstanding = () => {
        return getOutstandingAmount() - getNewPaymentsTotal();
    };

    // Add new payment method
    const addPaymentMethod = () => {
        if (!selectedPaymentMethod) return;

        const method = dropdownPaymentMethods.find(m => m.id === parseInt(selectedPaymentMethod));
        if (!method) return;

        // Don't allow manual addition of pending payment method
        if (parseInt(selectedPaymentMethod) === PENDING_PAYMENT_METHOD_ID) {
            alert('Pending payment method is auto-managed and cannot be added manually');
            return;
        }

        const newPayment = {
            id: Date.now(),
            methodId: parseInt(selectedPaymentMethod),
            methodName: method.payment_method_name,
            amount: 0,
            remark: ''
        };

        setNewPayments([...newPayments, newPayment]);
        setSelectedPaymentMethod('');
    };

    // Remove payment method
    const removePaymentMethod = (paymentId) => {
        setNewPayments(newPayments.filter(p => p.id !== paymentId));
    };

    // Update payment amount
    const updatePaymentAmount = (paymentId, amount) => {
        const numAmount = parseFloat(amount) || 0;
        const otherPaymentsTotal = newPayments
            .filter(p => p.id !== paymentId)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const maxAllowed = getOutstandingAmount() - otherPaymentsTotal;
        const clampedAmount = Math.min(numAmount, Math.max(0, maxAllowed));

        setNewPayments(newPayments.map(payment => 
            payment.id === paymentId 
                ? { ...payment, amount: clampedAmount }
                : payment
        ));
    };

    // Update payment remark
    const updatePaymentRemark = (paymentId, remark) => {
        setNewPayments(newPayments.map(payment => 
            payment.id === paymentId 
                ? { ...payment, remark }
                : payment
        ));
    };

    // Auto-update pending payment
    const getUpdatedPendingAmount = () => {
        const remaining = getRemainingOutstanding();
        return Math.max(0, remaining);
    };

    // Process payment
    const processPayment = async () => {
        if (!paymentHandlerId) {
            alert('Please select a payment handler');
            return;
        }

        if (newPayments.length === 0) {
            alert('Please add at least one payment method');
            return;
        }

        // Validate all payments have amounts
        const invalidPayments = newPayments.filter(p => !p.amount || parseFloat(p.amount) <= 0);
        if (invalidPayments.length > 0) {
            alert('Please enter valid amounts for all payment methods');
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

            console.log('Processing payments:', allPayments);

            // Process each payment
            for (const payment of allPayments) {
                const paymentData = {
                    sale_transaction_id: parseInt(id),
                    payment_method_id: payment.methodId,
                    amount: parseFloat(payment.amount),
                    remarks: payment.remark || generalRemark || '',
                    payment_handler_id: parseInt(paymentHandlerId)
                };

                console.log('Sending payment:', paymentData);

                const response = await api.post('/st/payment', paymentData);
                
                if (!response.data.success) {
                    throw new Error(response.data.message || 'Failed to process payment');
                }
            }

            alert('Payment processed successfully!');
            navigate('/sale-transaction/list');

        } catch (err) {
            console.error('Error processing payment:', err);
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
                                {/* Payment Handler Selection */}
                                <div>
                                    <Label>Payment Handler *</Label>
                                    <EmployeeSelect
                                        value={paymentHandlerId}
                                        onChange={setPaymentHandlerId}
                                        errors={{}}
                                    />
                                </div>

                                {/* Add Payment Method */}
                                <div>
                                    <Label>Add Payment Method</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <PaymentMethodSelect
                                                value={selectedPaymentMethod}
                                                onChange={setSelectedPaymentMethod}
                                                paymentMethods={dropdownPaymentMethods.filter(method => 
                                                    method.id !== PENDING_PAYMENT_METHOD_ID
                                                )}
                                                errors={{}}
                                            />
                                        </div>
                                        <Button
                                            onClick={addPaymentMethod}
                                            disabled={!selectedPaymentMethod}
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Payment Methods List */}
                                {newPayments.length > 0 && (
                                    <div className="space-y-3">
                                        <Label>Payment Methods</Label>
                                        {newPayments.map((payment) => (
                                            <div key={payment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0 w-24">
                                                    <span className="text-sm font-medium">{payment.methodName}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Amount"
                                                        value={payment.amount || ''}
                                                        onChange={(e) => updatePaymentAmount(payment.id, e.target.value)}
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
                                                    onClick={() => removePaymentMethod(payment.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* General Remark */}
                                <div>
                                    <Label>General Remark</Label>
                                    <Textarea
                                        placeholder="Enter general remark for all payments..."
                                        value={generalRemark}
                                        onChange={(e) => setGeneralRemark(e.target.value)}
                                        rows={3}
                                    />
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
                                        onClick={processPayment}
                                        disabled={processing || newPayments.length === 0 || !paymentHandlerId}
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