import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, DollarSign } from 'lucide-react';
import { api } from '@/interceptors/axios';

const InvoiceDetail = () => {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/ci/list/${id}`);
            setInvoice(response.data.data);
            console.log('Invoice data:', response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch invoice details');
            console.error('Error fetching invoice:', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to group items by care package
    const renderItems = (items) => {
        const packageGroups = new Map();
        const regularItems = [];

        // First pass: organize items into packages or regular items
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

        // Second pass: render all items in proper order
        const rows = [];

        // Add regular items first
        regularItems.forEach(item => {
            rows.push(
                <tr key={item.id} className="text-sm text-gray-900">
                    <td className="px-6 py-4">{item.service_name || item.product_name}</td>
                    <td className="px-6 py-4">{item.item_type}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">${Number(item.original_unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4">${Number(item.custom_unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4">{Number(item.discount_percentage).toFixed(2)}%</td>
                    <td className="px-6 py-4">${Number(item.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                </tr>
            );
        });

        // Add package groups with headers
        packageGroups.forEach((packageItems, packageId) => {
            // Add package header
            rows.push(
                <tr key={`package-header-${packageId}`} className="bg-gray-50">
                    <td colSpan="8" className="px-6 py-3">
                        <div className="font-medium">Care Package (ID: {packageId})</div>
                    </td>
                </tr>
            );

            // Add package items
            packageItems.forEach(item => {
                rows.push(
                    <tr key={item.id} className="text-sm text-gray-900 bg-gray-50/50">
                        <td className="px-6 py-4">{item.service_name || item.product_name}</td>
                        <td className="px-6 py-4">{item.item_type}</td>
                        <td className="px-6 py-4">{item.quantity}</td>
                        <td className="px-6 py-4">${Number(item.original_unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4">${Number(item.custom_unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4">{Number(item.discount_percentage).toFixed(2)}%</td>
                        <td className="px-6 py-4">${Number(item.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 max-w-xs truncate" title={item.remarks}>{item.remarks || '-'}</td>
                    </tr>
                );
            });
        });

        return rows;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-xl font-semibold text-red-600">{error}</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-xl font-semibold">Invoice not found</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Back Button */}
            <div className="border-b border-gray-200 p-4">
                <button
                    onClick={() => navigate('/invoices')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Invoices
                </button>
            </div>

            {/* Invoice Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Invoice #{invoice.manual_invoice_no}</h2>
                        <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-500">
                                Created: {new Date(invoice.invoice_created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                                Customer Type: {invoice.customer_type}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${invoice.invoice_status === 'Invoice_Paid' ? 'bg-green-100 text-green-800' :
                            invoice.invoice_status === 'Invoice_Unpaid' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                        {invoice.invoice_status.replace('Invoice_', '')}
                    </span>
                </div>
            </div>

            {/* Customer & Handler Info */}
            <div className="grid grid-cols-2 gap-6 p-6 border-b border-gray-200">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Customer Information
                    </h3>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{invoice.member?.name || 'N/A'}</p>
                        {invoice.member?.email && (
                            <p className="text-sm text-gray-600">
                                <span className="text-gray-500 mr-2">Email:</span>
                                {invoice.member.email}
                            </p>
                        )}
                        {invoice.member?.contact && (
                            <p className="text-sm text-gray-600">
                                <span className="text-gray-500 mr-2">Phone:</span>
                                {invoice.member.contact}
                            </p>
                        )}
                        {invoice.member?.id && (
                            <p className="text-sm text-gray-600">
                                <span className="text-gray-500 mr-2">Member ID:</span>
                                {invoice.member.id}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Invoice Handler
                    </h3>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{invoice.handler?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Employee Code: {invoice.handler?.code}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Items
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                                <th className="px-6 py-3">Item</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Quantity</th>
                                <th className="px-6 py-3">Original Price</th>
                                <th className="px-6 py-3">Custom Price</th>
                                <th className="px-6 py-3">Discount</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {renderItems(invoice.items)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Information */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Payments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                                <th className="px-6 py-3">Payment ID</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.payments?.map((payment) => (
                                <tr key={payment.id} className="text-sm text-gray-900">
                                    <td className="px-6 py-4">{payment.id}</td>
                                    <td className="px-6 py-4">{payment.payment_method}</td>
                                    <td className="px-6 py-4">${Number(payment.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {new Date(payment.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">{payment.remarks || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="p-6">
                <div className="flex justify-end">
                    <div className="w-80 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Total Invoice Amount</span>
                            <span className="text-sm font-medium text-gray-900">
                                ${Number(invoice.total_invoice_amount).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Total Paid</span>
                            <span className="text-sm font-medium text-green-600">
                                ${Number(invoice.total_paid_amount).toFixed(2)}
                            </span>
                        </div>
                        {invoice.outstanding_total_payment_amount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Outstanding</span>
                                <span className="text-sm font-medium text-red-600">
                                    ${Number(invoice.outstanding_total_payment_amount).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Remarks */}
            {invoice.invoice_remark && (
                <div className="p-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Remarks</h3>
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{invoice.invoice_remark}</p>
                </div>
            )}
        </div>
    );
};

export default InvoiceDetail;