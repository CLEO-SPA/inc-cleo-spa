import React, { useState, useEffect } from 'react';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';

const TransactionForm = () => {
    const [carePackages, setCarePackages] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        memberCarePackageDetailsId: '',
        serviceId: '',
        employeeId: '',
        description: '',
        quantity: '1',
        amount: '0.00',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [carePackagesResponse, employeesResponse] = await Promise.all([
                    api.get('/mcp/get-mcp'),
                    api.get('/em/all'),
                ]);

                if (carePackagesResponse.status !== 200 || employeesResponse.status !== 200) {
                    throw new Error('Failed to fetch data');
                }

                setCarePackages(carePackagesResponse.data);
                setEmployees(employeesResponse.data);
            } catch (error) {
                setError('Error loading data. Please try again later.');
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchServices = async () => {
            if (formData.memberCarePackageDetailsId) {
                try {
                    setLoading(true);
                    const response = await api.get(`/t/services/${formData.memberCarePackageDetailsId}`);

                    if (response.status === 200) {
                        setServices(response.data);
                    } else {
                        setServices([]);
                    }
                } catch (error) {
                    console.error('Error fetching services:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchServices();
    }, [formData.memberCarePackageDetailsId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const memberCarePackageId = formData.memberCarePackageDetailsId
            const detailsResponse = await api.get(`/t/mcpd/${formData.memberCarePackageDetailsId}/${formData.serviceId}`);

            if (detailsResponse.data.success) {
                const { member_care_package_details_id } = detailsResponse.data.data;

                const submissionData = {
                    member_care_package_details_id: parseInt(member_care_package_details_id),
                    employee_id: parseInt(formData.employeeId),
                    service_id: parseInt(formData.serviceId),
                    member_care_package_transaction_logs_quantity: parseInt(formData.quantity),
                    member_care_package_transaction_logs_amount: parseFloat(formData.amount),
                    member_care_package_transaction_logs_transaction_type: "Payment",
                    member_care_package_transaction_logs_description: formData.description,
                };

                const createTransactionResponse = await api.post('/t', submissionData);

                if (createTransactionResponse.status !== 201) {
                    throw new Error('Failed to create transaction');
                }

                setFormData({
                    memberCarePackageDetailsId: '',
                    serviceId: '',
                    employeeId: '',
                    description: '',
                    quantity: '1',
                    amount: '0.00',
                });
            } else {
                throw new Error('Failed to retrieve member care package details');
            }
        } catch (error) {
            setError('Failed to create transaction. Please try again.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!formData.memberCarePackageDetailsId || !formData.employeeId) {
            setError('All fields are required');
            return false;
        }

        if (parseInt(formData.quantity) < 1) {
            setError('Quantity must be at least 1');
            return false;
        }

        if (parseFloat(formData.amount) < 0) {
            setError('Amount cannot be negative');
            return false;
        }

        return true;
    };

    if (loading && (!carePackages.length || !employees.length)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-900">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-8 shadow-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Transaction Log</h1>
                    <p className="text-gray-600 mb-6">Enter transaction details</p>
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Field label="Select Member Care Package">
                            <select
                                value={carePackages.find(pkg => pkg.member_care_package_id === formData.memberCarePackageDetailsId)?.care_package_name || ""}
                                onChange={(e) => {
                                    const selectedPackageName = e.target.value;
                                    const selectedPackage = carePackages.find(pkg => pkg.care_package_name.trim() === selectedPackageName.trim());
                                    if (selectedPackage) {
                                        setFormData({
                                            ...formData,
                                            memberCarePackageDetailsId: selectedPackage.member_care_package_id,
                                        });
                                    }
                                }}
                                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a member care package</option>
                                {carePackages.map((pkg) => (
                                    <option key={pkg.member_care_package_id} value={pkg.care_package_name}>
                                        {pkg.care_package_name} - ${pkg.member_care_package_total_amount}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Select Service under Member Care Package">
                            <select
                                value={formData.serviceId}
                                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a service</option>
                                {services.map((service) => (
                                    <option key={service.service_id} value={service.service_id}>
                                        {service.service_name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Select Employee">
                            <select
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select an employee</option>
                                {employees.map((emp) => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.employee_name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Description">
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter transaction details"
                                rows={3}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Quantity">
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    min="1"
                                    required
                                />
                            </Field>

                            <Field label="Amount ($)">
                                <input
                                    type="text"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </Field>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Transaction'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransactionForm;