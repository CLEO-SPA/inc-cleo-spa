// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, DollarSign, User, CreditCard, Package, RefreshCcw } from 'lucide-react';
// import api from '@/services/api';
// import { AppSidebar } from '@/components/app-sidebar';
// import { SiteHeader } from '@/components/site-header';
// import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import EmployeeModal from './EmployeeModal';

// const ProcessPaymentSaleTransaction = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [transaction, setTransaction] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [paymentMethods, setPaymentMethods] = useState([]);
//     const [paymentBreakdown, setPaymentBreakdown] = useState([]);
//     const [warnings, setWarnings] = useState({});
//     const [remainingAmount, setRemainingAmount] = useState(0);
//     const [selectedHandler, setSelectedHandler] = useState(null);
//     const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
//     const [unpaidServices, setUnpaidServices] = useState([]);
//     const [selectedServices, setSelectedServices] = useState({});

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
//                 console.log('Fetching data for transaction:', id);

//                 const [transactionRes, methodsRes, unpaidServicesRes] = await Promise.all([
//                     api.get(`/st/list/${id}`),
//                     api.get('/payment/methods'),
//                     api.get(`/st/unpaid-services/${id}`)
//                 ]);

//                 console.log('API responses:', {
//                     transaction: transactionRes.data,
//                     methods: methodsRes.data,
//                     unpaidServices: unpaidServicesRes.data
//                 });

//                 if (!transactionRes.data.success) {
//                     throw new Error('Failed to fetch transaction data');
//                 }

//                 if (transactionRes.data.success && transactionRes.data.data) {
//                     setTransaction(transactionRes.data.data);
//                     setRemainingAmount(transactionRes.data.data.outstanding_total_payment_amount);
//                 }

//                 // Assuming the API returns payment methods in a similar format
//                 if (methodsRes.data.success) {
//                     const filteredMethods = methodsRes.data.data.map(method => ({
//                         id: method.payment_method_id,
//                         name: method.payment_method_name
//                     }));
//                     setPaymentMethods(filteredMethods);
//                 }

//                 // Handle unpaid services data
//                 if (unpaidServicesRes.data.success) {
//                     setUnpaidServices(unpaidServicesRes.data.data.services || []);
//                 }

//             } catch (err) {
//                 console.error("Error fetching data:", err);
//                 setError(err.message || 'Failed to fetch data');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (id) {
//             fetchData();
//         }
//     }, [id]);

//     const handlePaymentChange = (methodId, value) => {
//         const amount = parseFloat(value) || 0;
//         if (!transaction) return;

//         const requiredAmount = calculateRequiredPayment();

//         setPaymentBreakdown(prev => {
//             // Find existing payment or create new one
//             let updatedBreakdown = [...prev];
//             const existingIndex = updatedBreakdown.findIndex(item => item.id === methodId);

//             if (existingIndex >= 0) {
//                 // Update existing payment
//                 updatedBreakdown[existingIndex] = {
//                     ...updatedBreakdown[existingIndex],
//                     amount
//                 };
//             } else {
//                 // Add new payment
//                 updatedBreakdown.push({
//                     id: methodId,
//                     name: paymentMethods.find(m => m.id === methodId)?.name || 'Unknown Method',
//                     amount,
//                     remark: ''
//                 });
//             }

//             // Calculate total of all payments except current one
//             const otherPaymentsTotal = updatedBreakdown
//                 .filter(item => item.id !== methodId)
//                 .reduce((total, item) => total + (item.amount || 0), 0);

//             // Adjust current payment if total exceeds required amount
//             const maxAllowedForThisMethod = requiredAmount - otherPaymentsTotal;
//             if (amount > maxAllowedForThisMethod) {
//                 const adjustedAmount = Math.max(0, maxAllowedForThisMethod);
//                 updatedBreakdown = updatedBreakdown.map(item =>
//                     item.id === methodId ? { ...item, amount: adjustedAmount } : item
//                 );
//             }

//             // Remove any payments with zero or negative amounts
//             updatedBreakdown = updatedBreakdown.filter(item => item.amount > 0);

//             // Calculate new total and remaining amount
//             const newTotal = updatedBreakdown.reduce((total, item) => total + (item.amount || 0), 0);
//             setRemainingAmount(requiredAmount - newTotal);

//             return updatedBreakdown;
//         });
//     };

//     const calculateRequiredPayment = () => {
//         if (Object.keys(selectedServices).length === 0) {
//             return transaction?.outstanding_total_payment_amount || 0;
//         }
        
//         return Object.values(selectedServices)
//             .flat()
//             .reduce((total, service) => total + (service.original_price || 0), 0);
//     };

//     const handleServiceSelection = (service, packageId) => {
//         setSelectedServices(prev => {
//             const currentPackageServices = prev[packageId] || [];
//             const serviceExists = currentPackageServices.some(
//                 s => s.member_care_package_details_id === service.member_care_package_details_id
//             );

//             let newSelectedServices;
//             if (serviceExists) {
//                 // Remove service
//                 const filteredServices = currentPackageServices.filter(
//                     s => s.member_care_package_details_id !== service.member_care_package_details_id
//                 );

//                 // If no services left for this package, remove the package key
//                 if (filteredServices.length === 0) {
//                     const { [packageId]: removed, ...rest } = prev;
//                     newSelectedServices = rest;
//                 } else {
//                     newSelectedServices = {
//                         ...prev,
//                         [packageId]: filteredServices
//                     };
//                 }
//             } else {
//                 // Add service
//                 newSelectedServices = {
//                     ...prev,
//                     [packageId]: [...currentPackageServices, {
//                         member_care_package_id: service.member_care_package_id,
//                         member_care_package_details_id: service.member_care_package_details_id,
//                         service_name: service.service_name,
//                         original_price: parseFloat(service.original_price)
//                     }]
//                 };
//             }

//             // Calculate new required amount and update remaining amount
//             const newRequiredAmount = Object.values(newSelectedServices)
//                 .flat()
//                 .reduce((total, s) => total + (s.original_price || 0), 0);

//             setRemainingAmount(newRequiredAmount - paymentBreakdown.reduce((sum, p) => sum + (p.amount || 0), 0));

//             return newSelectedServices;
//         });
//     };

//     const handleSubmitPayment = async () => {
//         if (!selectedHandler) {
//             alert('Please select a payment handler');
//             return;
//         }

//         const requiredAmount = calculateRequiredPayment();
//         const totalPayment = paymentBreakdown.reduce((sum, p) => sum + p.amount, 0);

//         if (totalPayment === 0) {
//             alert('Please enter payment amount');
//             return;
//         }

//         if (totalPayment !== requiredAmount) {
//             alert(`Payment must equal exactly $${requiredAmount.toFixed(2)}`);
//             return;
//         }

//         try {
//             const payments = paymentBreakdown.map(payment => ({
//                 transaction_id: id,
//                 payment_method_id: payment.id,
//                 payment_handler_id: selectedHandler.employee_id,
//                 payment_amount: payment.amount,
//                 payment_remark: payment.remark || '',
//                 selected_services: Object.entries(selectedServices).reduce((acc, [packageId, services]) => {
//                     return [...acc, ...services.map(service => ({
//                         member_care_package_id: service.member_care_package_id,
//                         member_care_package_details_id: service.member_care_package_details_id,
//                         service_name: service.service_name,
//                         original_price: service.original_price
//                     }))];
//                 }, [])
//             }));

//             for (const payment of payments) {
//                 const response = await api.post('/st/payment', payment);
//                 if (!response.data.success) {
//                     throw new Error(response.data.message || 'Failed to process payment');
//                 }
//             }

//             alert('Payment processed successfully');
//             navigate('/sale-transaction/list');
//         } catch (err) {
//             console.error('Error processing payment:', err);
//             alert(err.response?.data?.message || 'Failed to process payment. Please try again.');
//         }
//     };

//     const handleEmployeeSelect = (employee) => {
//         setSelectedHandler(employee);
//         setIsEmployeeModalOpen(false);
//     };

//     const renderContent = () => {
//         if (loading) {
//             return (
//                 <div className="flex items-center justify-center h-64">
//                     <div className="animate-pulse flex flex-col items-center">
//                         <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
//                         <div className="text-gray-600">Loading transaction details...</div>
//                     </div>
//                 </div>
//             );
//         }

//         if (error) {
//             return (
//                 <div className="flex items-center justify-center h-64">
//                     <div className="text-center p-8">
//                         <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
//                         <div className="text-gray-600 mb-6">{error}</div>
//                         <Button onClick={() => window.location.reload()}>Try Again</Button>
//                     </div>
//                 </div>
//             );
//         }

//         if (!transaction) {
//             return (
//                 <div className="flex items-center justify-center h-64">
//                     <div className="text-center p-8">
//                         <div className="text-gray-600 text-xl mb-2">Transaction not found</div>
//                         <div className="text-gray-500 mb-6">The requested transaction details could not be found</div>
//                         <Button onClick={() => navigate('/sale-transaction/list')}>Back to Transactions</Button>
//                     </div>
//                 </div>
//             );
//         }

//         return (
//             <div className="space-y-6">
//                 {/* Header Card */}
//                 <Card>
//                     <CardHeader className="pb-3">
//                         <div className="flex items-center justify-between">
//                             <CardTitle className="text-xl font-bold flex items-center">
//                                 <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
//                                 Process Payment for Receipt #{transaction.receipt_no}
//                             </CardTitle>
//                             <div className="flex gap-2">
//                                 <Button 
//                                     variant="outline" 
//                                     size="sm"
//                                     className="flex items-center gap-1"
//                                     onClick={() => window.location.reload()}
//                                 >
//                                     <RefreshCcw className="h-4 w-4" />
//                                     <span>Refresh</span>
//                                 </Button>
//                                 <Button 
//                                     variant="outline" 
//                                     size="sm"
//                                     className="flex items-center gap-1"
//                                     onClick={() => navigate('/sale-transaction/list')}
//                                 >
//                                     <ArrowLeft className="h-4 w-4" />
//                                     <span>Back to Transactions</span>
//                                 </Button>
//                             </div>
//                         </div>
//                     </CardHeader>
//                 </Card>

//                 {/* Transaction Summary Card */}
//                 <Card>
//                     <CardHeader className="pb-3">
//                         <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
//                             <CreditCard className="h-4 w-4 mr-2" />
//                             Transaction Summary
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             <div>
//                                 <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Details</h3>
//                                 <div className="bg-blue-50 p-4 rounded-lg">
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Transaction ID:</span>
//                                         <span className="font-medium">{transaction.transaction_id}</span>
//                                     </div>
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Receipt Number:</span>
//                                         <span className="font-medium">#{transaction.receipt_no}</span>
//                                     </div>
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Status:</span>
//                                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
//                                             ${transaction.transaction_status === 'FULL' ? 'bg-green-100 text-green-800' :
//                                              transaction.transaction_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
//                                              'bg-red-100 text-red-800'}`}>
//                                             {transaction.transaction_status === 'FULL' ? 'Fully Paid' :
//                                              transaction.transaction_status === 'PARTIAL' ? 'Partially Paid' :
//                                              transaction.transaction_status}
//                                         </span>
//                                     </div>
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Date:</span>
//                                         <span className="font-medium">{new Date(transaction.transaction_created_at).toLocaleDateString()}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div>
//                                 <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Summary</h3>
//                                 <div className="bg-yellow-50 p-4 rounded-lg">
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Total Amount:</span>
//                                         <span className="font-medium">${parseFloat(transaction.total_transaction_amount).toFixed(2)}</span>
//                                     </div>
//                                     <div className="flex justify-between mb-2">
//                                         <span className="text-gray-600">Already Paid:</span>
//                                         <span className="font-medium text-green-600">${parseFloat(transaction.total_paid_amount).toFixed(2)}</span>
//                                     </div>
//                                     <div className="flex justify-between mb-2 border-t border-yellow-200 pt-2">
//                                         <span className="text-gray-600 font-medium">Outstanding:</span>
//                                         <span className="font-bold text-red-600">${parseFloat(transaction.outstanding_total_payment_amount).toFixed(2)}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Payment Handler Selection */}
//                 <Card>
//                     <CardHeader className="pb-3">
//                         <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
//                             <User className="h-4 w-4 mr-2" />
//                             Payment Handler
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="flex items-center gap-4">
//                             <input
//                                 type="text"
//                                 value={selectedHandler?.employee_name || ''}
//                                 placeholder="Click to select employee"
//                                 className="flex-1 p-2 border border-gray-300 rounded"
//                                 readOnly
//                                 onClick={() => setIsEmployeeModalOpen(true)}
//                             />
//                             <Button
//                                 variant="secondary"
//                                 onClick={() => setIsEmployeeModalOpen(true)}
//                             >
//                                 Select Employee
//                             </Button>
//                         </div>
//                         {selectedHandler && (
//                             <div className="mt-2 text-sm text-gray-600">
//                                 <span className="font-medium">Selected:</span> {selectedHandler.employee_name} ({selectedHandler.employee_code})
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>

//                 {/* Payment Required Notice */}
//                 <Card className="bg-yellow-50 border border-yellow-200">
//                     <CardContent className="p-4">
//                         <div className="flex justify-between items-center">
//                             <div>
//                                 <p className="font-bold text-lg text-red-600">
//                                     Required Payment: ${calculateRequiredPayment().toFixed(2)}
//                                 </p>
//                                 {Object.keys(selectedServices).length > 0 ? (
//                                     <p className="text-sm text-gray-600">
//                                         Selected Services: {
//                                             Object.values(selectedServices)
//                                                 .flat()
//                                                 .length
//                                         } items
//                                     </p>
//                                 ) : (
//                                     <p className="text-sm text-gray-600">
//                                         Full outstanding balance
//                                     </p>
//                                 )}
//                             </div>
//                             <div>
//                                 <p className="font-bold text-lg">
//                                     Current Total: ${(calculateRequiredPayment() - remainingAmount).toFixed(2)}
//                                 </p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Package Services Selection (if available) */}
//                 {unpaidServices.length > 0 && (
//                     <Card>
//                         <CardHeader className="pb-3">
//                             <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
//                                 <Package className="h-4 w-4 mr-2" />
//                                 Package Services
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="bg-gray-50 rounded-lg p-4">
//                                 {Object.entries(
//                                     unpaidServices.reduce((acc, service) => {
//                                         const packageId = service.member_care_package_id;
//                                         if (!acc[packageId]) {
//                                             acc[packageId] = {
//                                                 name: service.care_package_name,
//                                                 services: []
//                                             };
//                                         }
//                                         acc[packageId].services.push(service);
//                                         return acc;
//                                     }, {})
//                                 ).map(([packageId, packageData]) => (
//                                     <div key={packageId} className="mb-4 last:mb-0">
//                                         <h3 className="font-medium text-blue-600 mb-2">
//                                             {packageData.name}
//                                         </h3>
//                                         <div className="space-y-2">
//                                             {packageData.services.map((service) => (
//                                                 <div
//                                                     key={service.member_care_package_details_id}
//                                                     className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
//                                                 >
//                                                     <div className="flex items-center gap-4">
//                                                         <button
//                                                             onClick={() => handleServiceSelection(service, packageId)}
//                                                             className={`px-3 py-1 rounded-full ${selectedServices[packageId]?.some(
//                                                                 s => s.member_care_package_details_id === service.member_care_package_details_id
//                                                             )
//                                                                 ? 'bg-red-100 text-red-700 hover:bg-red-200'
//                                                                 : 'bg-blue-500 text-white hover:bg-blue-600'
//                                                                 }`}
//                                                         >
//                                                             {selectedServices[packageId]?.some(
//                                                                 s => s.member_care_package_details_id === service.member_care_package_details_id
//                                                             )
//                                                                 ? '- Remove'
//                                                                 : '+ Add'
//                                                             }
//                                                         </button>
//                                                         <div>
//                                                             <div className="font-medium">{service.service_name}</div>
//                                                             <div className="text-sm text-gray-500">
//                                                                 Status: {service.status || 'Available'}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <div className="text-right">
//                                                         <div className="font-medium">
//                                                             ${parseFloat(service.original_price).toFixed(2)}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* Payment Methods */}
//                 <Card>
//                     <CardHeader className="pb-3">
//                         <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
//                             <CreditCard className="h-4 w-4 mr-2" />
//                             Payment Methods
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-4">
//                             {paymentMethods.map(method => (
//                                 <div key={method.id} className="flex gap-4 items-start">
//                                     <div className="flex-1">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             {method.name}
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             onChange={(e) => handlePaymentChange(method.id, e.target.value)}
//                                             value={paymentBreakdown.find(p => p.id === method.id)?.amount || ''}
//                                             className="w-full p-2 border border-gray-300 rounded"
//                                             placeholder="Enter amount"
//                                         />
//                                         {warnings[method.id] && (
//                                             <p className="text-red-500 text-sm mt-1">{warnings[method.id]}</p>
//                                         )}
//                                     </div>
//                                     <div className="flex-1">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             Remark
//                                         </label>
//                                         <input
//                                             type="text"
//                                             value={paymentBreakdown.find(p => p.id === method.id)?.remark || ''}
//                                             onChange={(e) => {
//                                                 setPaymentBreakdown(prev => prev.map(p =>
//                                                     p.id === method.id ? { ...p, remark: e.target.value } : p
//                                                 ));
//                                             }}
//                                             className="w-full p-2 border border-gray-300 rounded"
//                                             placeholder="Enter remark"
//                                         />
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Payment Summary */}
//                 <Card className="bg-gray-50 border border-gray-200">
//                     <CardContent className="p-4">
//                         <div className="flex justify-between mb-2">
//                             <span className="font-medium">Amount to Pay:</span>
//                             <span>${(calculateRequiredPayment() - remainingAmount).toFixed(2)}</span>
//                         </div>
//                         <div className="flex justify-between font-medium">
//                             <span>Remaining Amount:</span>
//                             <span>${remainingAmount.toFixed(2)}</span>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Process Payment Button */}
//                 <Button
//                     onClick={handleSubmitPayment}
//                     disabled={!selectedHandler || paymentBreakdown.length === 0}
//                     className="w-full py-6 text-lg font-bold"
//                     variant="default"
//                     size="lg"
//                 >
//                     Process Payment
//                 </Button>
//             </div>
//         );
//     };

//     return (
//         <div className='[--header-height:calc(theme(spacing.14))]'>
//             <SidebarProvider className='flex flex-col'>
//                 <SiteHeader />
//                 <div className='flex flex-1'>
//                     <AppSidebar />
//                     <SidebarInset>
//                         <div className="max-w-[1600px] mx-auto p-4">
//                             {renderContent()}
//                         </div>
//                     </SidebarInset>
//                 </div>
//             </SidebarProvider>
//             <EmployeeModal
//                 isOpen={isEmployeeModalOpen}
//                 onClose={() => setIsEmployeeModalOpen(false)}
//                 onSelectEmployee={handleEmployeeSelect}
//                 selectedEmployee={selectedHandler}
//             />
//         </div>
//     );
// };

// export default ProcessPaymentSaleTransaction;