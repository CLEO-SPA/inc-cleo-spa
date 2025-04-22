import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../interceptors/axios';
import EmployeeModal from './EmployeeModal';

const InvoicePayment = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState([]);
    const [warnings, setWarnings] = useState({});
    const [remainingAmount, setRemainingAmount] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [selectedHandler, setSelectedHandler] = useState(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [unpaidServices, setUnpaidServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching data for invoice:', invoiceId);

                const [invoiceRes, methodsRes, unpaidServicesRes] = await Promise.all([
                    api.get(`/ci/list/${invoiceId}`),
                    api.get('/ci/getAllPaymentMethods'),
                    api.get(`/ci/payment/${invoiceId}`)
                ]);

                console.log('API responses:', {
                    invoice: invoiceRes.data,
                    methods: methodsRes.data,
                    unpaidServices: unpaidServicesRes.data
                });

                if (!invoiceRes.data.success) {
                    throw new Error('Failed to fetch invoice data');
                }

                if (invoiceRes.data.success && invoiceRes.data.data) {
                    setInvoice(invoiceRes.data.data);
                    setRemainingAmount(invoiceRes.data.data.outstanding_total_payment_amount);
                }

                const filteredMethods = methodsRes.data.data
                    .filter(method => ['1', '3', '4', '5'].includes(method.payment_method_id))
                    .map(method => ({
                        id: method.payment_method_id,
                        name: method.payment_method_name
                    }));
                setPaymentMethods(filteredMethods);

                // Handle unpaid services data
                if (unpaidServicesRes.data.success) {
                    const { services, member } = unpaidServicesRes.data.data;
                    console.log('Unpaid services:', services);
                    setUnpaidServices(services);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        if (invoiceId) {
            fetchData();
        }
    }, [invoiceId]);

    const handlePaymentChange = (methodId, value) => {
        const amount = parseFloat(value) || 0;
        if (!invoice) return;

        const requiredAmount = calculateRequiredPayment();

        setPaymentBreakdown(prev => {
            // Find existing payment or create new one
            let updatedBreakdown = [...prev];
            const existingIndex = updatedBreakdown.findIndex(item => item.id === methodId);

            if (existingIndex >= 0) {
                // Update existing payment
                updatedBreakdown[existingIndex] = {
                    ...updatedBreakdown[existingIndex],
                    amount
                };
            } else {
                // Add new payment
                updatedBreakdown.push({
                    id: methodId,
                    name: paymentMethods.find(m => m.id === methodId).name,
                    amount,
                    remark: ''
                });
            }

            // Calculate total of all payments except current one
            const otherPaymentsTotal = updatedBreakdown
                .filter(item => item.id !== methodId)
                .reduce((total, item) => total + (item.amount || 0), 0);

            // Adjust current payment if total exceeds required amount
            const maxAllowedForThisMethod = requiredAmount - otherPaymentsTotal;
            if (amount > maxAllowedForThisMethod) {
                const adjustedAmount = Math.max(0, maxAllowedForThisMethod);
                updatedBreakdown = updatedBreakdown.map(item =>
                    item.id === methodId ? { ...item, amount: adjustedAmount } : item
                );
            }

            // Remove any payments with zero or negative amounts
            updatedBreakdown = updatedBreakdown.filter(item => item.amount > 0);

            // Calculate new total and remaining amount
            const newTotal = updatedBreakdown.reduce((total, item) => total + (item.amount || 0), 0);
            setRemainingAmount(requiredAmount - newTotal);

            return updatedBreakdown;
        });
    };

    const calculateRequiredPayment = () => {
        return Object.values(selectedServices)
            .flat()
            .reduce((total, service) => total + (service.original_price || 0), 0);
    };

    const handleServiceSelection = (service, packageId) => {
        setSelectedServices(prev => {
            const currentPackageServices = prev[packageId] || [];
            const serviceExists = currentPackageServices.some(
                s => s.member_care_package_details_id === service.member_care_package_details_id
            );

            let newSelectedServices;
            if (serviceExists) {
                // Remove service
                const filteredServices = currentPackageServices.filter(
                    s => s.member_care_package_details_id !== service.member_care_package_details_id
                );

                // If no services left for this package, remove the package key
                if (filteredServices.length === 0) {
                    const { [packageId]: removed, ...rest } = prev;
                    newSelectedServices = rest;
                } else {
                    newSelectedServices = {
                        ...prev,
                        [packageId]: filteredServices
                    };
                }
            } else {
                // Add service
                newSelectedServices = {
                    ...prev,
                    [packageId]: [...currentPackageServices, {
                        member_care_package_id: service.member_care_package_id,
                        member_care_package_details_id: service.member_care_package_details_id,
                        service_name: service.service_name,
                        original_price: parseFloat(service.original_price)
                    }]
                };
            }

            // Calculate new required amount and update remaining amount
            const newRequiredAmount = Object.values(newSelectedServices)
                .flat()
                .reduce((total, s) => total + (s.original_price || 0), 0);

            setRemainingAmount(newRequiredAmount - paymentBreakdown.reduce((sum, p) => sum + (p.amount || 0), 0));

            return newSelectedServices;
        });
    };

    const handleSubmitPayment = async () => {
        if (!selectedHandler) {
            alert('Please select a payment handler');
            return;
        }

        const requiredAmount = calculateRequiredPayment();
        const totalPayment = paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);

        if (totalPayment === 0) {
            alert('Please enter payment amount');
            return;
        }

        if (totalPayment !== requiredAmount) {
            alert(`Payment must equal exactly $${requiredAmount.toFixed(2)}`);
            return;
        }

        try {
            const payments = paymentBreakdown.map(payment => ({
                invoice_id: invoiceId,
                payment_method_id: payment.id,
                payment_handler_id: selectedHandler.employee_id,
                payment_amount: payment.amount,
                payment_remark: payment.remark || '',
                selected_services: Object.entries(selectedServices).reduce((acc, [packageId, services]) => {
                    return [...acc, ...services.map(service => ({
                        member_care_package_id: service.member_care_package_id,
                        member_care_package_details_id: service.member_care_package_details_id,
                        service_name: service.service_name,
                        original_price: service.original_price
                    }))];
                }, [])
            }));

            for (const payment of payments) {
                const response = await api.post('/ci/createPayment', payment);
                if (!response.data.success) {
                    throw new Error(response.data.message || 'Failed to process payment');
                }
            }

            alert('Payment processed successfully');
            navigate('/invoices');
        } catch (err) {
            console.error('Error processing payment:', err);
            alert(err.response?.data?.message || 'Failed to process payment. Please try again.');
        }
    };

    const handleEmployeeSelect = (employee) => {
        setSelectedHandler(employee);
        setIsEmployeeModalOpen(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-xl font-semibold">Loading...</div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-xl font-semibold text-red-600">Error: {error}</div>
        </div>
    );

    if (!invoice) return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-xl font-semibold">Invoice not found</div>
        </div>
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/invoices')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold">Payment</h1>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Handler:
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={selectedHandler?.employee_name || ''}
                        placeholder="Click to select employee"
                        className="flex-1 p-2 border border-gray-300 rounded"
                        readOnly
                        onClick={() => setIsEmployeeModalOpen(true)}
                    />
                    <button
                        type="button"
                        onClick={() => setIsEmployeeModalOpen(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Select Employee
                    </button>
                </div>
                {selectedHandler && (
                    <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Selected:</span> {selectedHandler.employee_name} ({selectedHandler.employee_code})
                    </div>
                )}
            </div>

            <div className="text-right font-bold text-lg mb-6">
                Outstanding Amount: ${parseFloat(invoice.outstanding_total_payment_amount).toFixed(2)}
            </div>

            <div className="mt-4 mb-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg text-red-600">
                            Required Payment: ${calculateRequiredPayment().toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                            Selected Services: {
                                Object.values(selectedServices)
                                    .flat()
                                    .length
                            } items
                        </p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">
                            Current Total: ${(calculateRequiredPayment() - remainingAmount).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {unpaidServices.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4">Package Services</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                        {Object.entries(
                            unpaidServices.reduce((acc, service) => {
                                const packageId = service.member_care_package_id;
                                if (!acc[packageId]) {
                                    acc[packageId] = {
                                        name: service.care_package_name,
                                        services: []
                                    };
                                }
                                acc[packageId].services.push(service);
                                return acc;
                            }, {})
                        ).map(([packageId, packageData]) => (
                            <div key={packageId} className="mb-4 last:mb-0">
                                <h3 className="font-medium text-blue-600 mb-2">
                                    {packageData.name}
                                </h3>
                                <div className="space-y-2">
                                    {packageData.services.map((service) => (
                                        <div
                                            key={service.member_care_package_details_id}
                                            className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                                        >
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleServiceSelection(service, packageId)}
                                                    className={`px-3 py-1 rounded-full ${selectedServices[packageId]?.some(
                                                        s => s.member_care_package_details_id === service.member_care_package_details_id
                                                    )
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                >
                                                    {selectedServices[packageId]?.some(
                                                        s => s.member_care_package_details_id === service.member_care_package_details_id
                                                    )
                                                        ? '- Remove'
                                                        : '+ Add'
                                                    }
                                                </button>
                                                <div>
                                                    <div className="font-medium">{service.service_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Status: {service.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">
                                                    ${parseFloat(service.original_price).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4 mb-6">
                {paymentMethods.map(method => (
                    <div key={method.id} className="flex gap-4 items-start">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {method.name}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                onChange={(e) => handlePaymentChange(method.id, e.target.value)}
                                value={paymentBreakdown.find(p => p.id === method.id)?.amount || ''}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="Enter amount"
                            />
                            {warnings[method.id] && (
                                <p className="text-red-500 text-sm mt-1">{warnings[method.id]}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Remark
                            </label>
                            <input
                                type="text"
                                value={paymentBreakdown.find(p => p.id === method.id)?.remark || ''}
                                onChange={(e) => {
                                    setPaymentBreakdown(prev => prev.map(p =>
                                        p.id === method.id ? { ...p, remark: e.target.value } : p
                                    ));
                                }}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="Enter remark"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                    <span className="font-medium">Amount to Pay:</span>
                    <span>${(parseFloat(invoice.outstanding_total_payment_amount) - remainingAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                    <span>Remaining Amount:</span>
                    <span>${remainingAmount.toFixed(2)}</span>
                </div>
            </div>

            <button
                onClick={handleSubmitPayment}
                disabled={!selectedHandler || paymentBreakdown.length === 0}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
            >
                Process Payment
            </button>

            <EmployeeModal
                isOpen={isEmployeeModalOpen}
                onClose={() => setIsEmployeeModalOpen(false)}
                onSelectEmployee={handleEmployeeSelect}
                selectedEmployee={selectedHandler}
            />
        </div>
    );
};

export default InvoicePayment;