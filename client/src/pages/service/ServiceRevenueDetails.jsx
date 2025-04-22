import React, { useEffect, useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { serviceRevenueApi } from './ServiceRevenueApi';

const ServiceRevenueDetails = ({ selectedDate, onClose }) => {
    const [details, setDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await serviceRevenueApi.getDetailsByDate(selectedDate);
                if (response.success) {
                    setDetails(response.data);
                } else {
                    setError('Failed to fetch details');
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch details');
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedDate) {
            fetchDetails();
        }
    }, [selectedDate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date) => {
        // Create a new date object to avoid modifying the original
        const displayDate = new Date(date);

        // Format date in local timezone
        return displayDate.toLocaleDateString('en-SG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Singapore' // Explicitly set timezone for consistency
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#1f2937] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-100">
                        Service Revenue Details - {selectedDate && formatDate(selectedDate)}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="text-blue-500">Loading...</div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500 bg-opacity-10 text-red-400 p-4 rounded">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {details.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="bg-[#1a2332] rounded-lg p-4 border border-gray-700"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-lg font-medium text-gray-100">
                                                Invoice #{invoice.invoiceNumber}
                                            </div>
                                            <div className="text-gray-400">
                                                {invoice.customerName} ({invoice.customerType})
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-gray-400">Payment Method</div>
                                            <div className="text-gray-100">{invoice.paymentMethod}</div>
                                        </div>
                                    </div>

                                    <table className="w-full mb-4">
                                        <thead>
                                            <tr className="text-gray-400 text-sm">
                                                <th className="text-left py-2">Service</th>
                                                <th className="text-right py-2">Quantity</th>
                                                <th className="text-right py-2">Unit Price</th>
                                                <th className="text-right py-2">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.services.map((service, idx) => (
                                                <tr key={idx} className="border-t border-gray-700">
                                                    <td className="py-2">{service.name}</td>
                                                    <td className="text-right py-2">{service.quantity}</td>
                                                    <td className="text-right py-2">
                                                        {formatCurrency(service.unitPrice)}
                                                    </td>
                                                    <td className="text-right py-2">
                                                        {formatCurrency(service.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex justify-end border-t border-gray-700 pt-4">
                                        <div className="text-right">
                                            <div className="text-gray-400">Total Amount</div>
                                            <div className="text-xl font-medium text-gray-100">
                                                {formatCurrency(invoice.total)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceRevenueDetails;