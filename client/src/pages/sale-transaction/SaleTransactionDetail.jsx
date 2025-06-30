import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, DollarSign, Receipt, Calendar, User, CreditCard, Info, RefreshCcw, Eye } from 'lucide-react';
import api from '@/services/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const SaleTransactionDetail = () => {
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTransaction();
    }, [id]);

    const fetchTransaction = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/st/list/${id}`);
            setTransaction(response.data.data);
            console.log('Transaction data:', response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch transaction details');
            console.error('Error fetching transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderItems = (items) => {
        const packageGroups = new Map();
        const regularItems = [];

        items?.forEach(item => {
            if (item.member_care_package_id) {
                if (!packageGroups.has(item.member_care_package_id)) {
                    packageGroups.set(item.member_care_package_id, []);
                }
                packageGroups.get(item.member_care_package_id).push(item);
            } else {
                regularItems.push(item);
            }
        });
        const rows = [];

        regularItems.forEach(item => {
            rows.push(
                <tr key={item.id} className="text-sm text-gray-900 hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.service_name || item.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${item.item_type === 'service' ? 'bg-blue-100 text-blue-800' :
                                item.item_type === 'product' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                            {item.item_type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">${Number(item.original_unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">${Number(item.custom_unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                        {Number(item.discount_percentage) > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {Number(item.discount_percentage).toFixed(2)}%
                            </span>
                        ) : (
                            '0%'
                        )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${Number(item.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                </tr>
            );
        });

        packageGroups.forEach((packageItems, packageId) => {
            rows.push(
                <tr key={`package-header-${packageId}`} className="bg-blue-50">
                    <td colSpan="8" className="px-6 py-3">
                        <div className="font-medium text-blue-700 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Care Package (ID: {packageId})
                        </div>
                    </td>
                </tr>
            );
            packageItems.forEach(item => {
                rows.push(
                    <tr key={item.id} className="text-sm text-gray-900 bg-blue-50/50 hover:bg-blue-100/50">
                        <td className="px-6 py-4 whitespace-nowrap">{item.service_name || item.product_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                ${item.item_type === 'service' ? 'bg-blue-100 text-blue-800' :
                                    item.item_type === 'product' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                {item.item_type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">${Number(item.original_unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">${Number(item.custom_unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                            {Number(item.discount_percentage) > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {Number(item.discount_percentage).toFixed(2)}%
                                </span>
                            ) : (
                                '0%'
                            )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">${Number(item.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                    </tr>
                );
            });
        });

        return rows;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <div className="text-gray-600">Loading transaction details...</div>
                        </div>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center p-8">
                            <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
                            <div className="text-gray-600 mb-6">{error}</div>
                            <Button onClick={fetchTransaction}>Try Again</Button>
                        </div>
                    </div>
                </div>
            );
        }

        if (!transaction) {
            return (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center p-8">
                            <div className="text-gray-600 text-xl mb-2">Transaction not found</div>
                            <div className="text-gray-500 mb-6">The requested transaction details could not be found</div>
                            <Button onClick={() => navigate('/sale-transaction/list')}>Back to Transactions</Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between border-b border-gray-200">
                        <div>
                            <div className="flex items-center mb-2">
                                <Receipt className="h-5 w-5 mr-2 text-gray-500" />
                                <h2 className="text-xl font-bold flex items-center">
                                    Receipt #{transaction.receipt_no}
                                    <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${transaction.transaction_status === 'FULL' ? 'bg-green-100 text-green-800' :
                                            transaction.transaction_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {transaction.transaction_status === 'FULL' ? 'Fully Paid' :
                                            transaction.transaction_status === 'PARTIAL' ? 'Partially Paid' :
                                                transaction.transaction_status}
                                    </span>
                                </h2>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                                <div className="flex items-center">
                                    <Info className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Transaction ID: {transaction.transaction_id}</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Created: {new Date(transaction.transaction_created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Customer Type: {transaction.customer_type}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={fetchTransaction}
                            >
                                <RefreshCcw className="h-4 w-4" />
                                <span>Refresh</span>
                            </Button>
                            {/* Check if transaction has a reference_sales_transaction_id */}
                            {transaction.reference_sales_transaction_id && transaction.reference_sales_transaction_id !== '0' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                                    onClick={() => navigate(`/sale-transaction/${transaction.reference_sales_transaction_id}`)}
                                >
                                    <Eye className="h-4 w-4" />
                                    <span>View Referenced Transaction</span>
                                </Button>
                            )}
                            {transaction.process_payment && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => navigate(`/sale-transaction/process-payment/${id}`)}
                                >
                                    <CreditCard className="h-4 w-4" />
                                    <span>Process Payment</span>
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => navigate('/sale-transaction/list')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Transactions</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Customer & Handler Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Customer Information
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                                        <User className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{transaction.member?.name || 'Guest'}</p>
                                        {transaction.member?.email && (
                                            <p className="text-sm text-gray-600">
                                                <span className="text-gray-500 mr-2">Email:</span>
                                                {transaction.member.email}
                                            </p>
                                        )}
                                        {transaction.member?.contact && (
                                            <p className="text-sm text-gray-600">
                                                <span className="text-gray-500 mr-2">Phone:</span>
                                                {transaction.member.contact}
                                            </p>
                                        )}
                                        {transaction.member?.id && (
                                            <p className="text-sm text-gray-600">
                                                <span className="text-gray-500 mr-2">Member ID:</span>
                                                {transaction.member.id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Transaction Handler
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                                        <User className="h-5 w-5 text-purple-700" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{transaction.handler?.name || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Employee Code: {transaction.handler?.code || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Transaction Items
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-center">Qty</th>
                                    <th className="px-6 py-3 text-right">Original</th>
                                    <th className="px-6 py-3 text-right">Custom</th>
                                    <th className="px-6 py-3 text-center">Discount</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transaction.items?.length > 0 ? (
                                    renderItems(transaction.items)
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-6 text-center text-gray-500">
                                            No items found in this transaction
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payment Information
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                                    <th className="px-6 py-3">Payment ID</th>
                                    <th className="px-6 py-3">Method</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transaction.payments?.length > 0 ? (
                                    transaction.payments.map((payment) => (
                                        <tr key={payment.id} className="text-sm text-gray-900 hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{payment.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {payment.payment_method?.toLowerCase() === 'cash' ?
                                                        <DollarSign className="h-4 w-4 mr-2" /> :
                                                        <CreditCard className="h-4 w-4 mr-2" />}
                                                    {payment.payment_method}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                ${Number(payment.amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(payment.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">{payment.remarks || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                                            No payment records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-gray-200 bg-gray-50 py-4 px-6">
                        <div className="ml-auto w-full max-w-xs space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Transaction Total</span>
                                <span className="text-sm font-medium text-gray-900">
                                    ${Number(transaction.total_transaction_amount).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Total Paid</span>
                                <span className="text-sm font-medium text-green-600">
                                    ${Number(transaction.total_paid_amount).toFixed(2)}
                                </span>
                            </div>
                            {transaction.outstanding_total_payment_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Outstanding</span>
                                    <span className="text-sm font-medium text-red-600">
                                        ${Number(transaction.outstanding_total_payment_amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-700">Outstanding Amount: </span>
                                    <span className={`text-sm font-bold ${transaction.transaction_status === 'FULL' ? 'text-green-600' : 'text-red-600'}`}>
                                        ${Number(transaction.outstanding_total_payment_amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remarks Section (Conditionally Rendered) */}
                {transaction.transaction_remark && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                <Info className="h-4 w-4 mr-2" />
                                Remarks
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{transaction.transaction_remark}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className="max-w-[1600px] mx-auto p-4">
                            {renderContent()}
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default SaleTransactionDetail;