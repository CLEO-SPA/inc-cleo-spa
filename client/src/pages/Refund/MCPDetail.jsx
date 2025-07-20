import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, DollarSign, Package, FileText, Clock, Calendar, X } from 'lucide-react';
import api from '@/services/refundService';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';

const DateTimePicker = ({ value, onChange, className }) => {
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const dateTimeValue = e.target.value;
    if (dateTimeValue) {
      onChange(new Date(dateTimeValue));
    } else {
      onChange(null);
    }
  };

  return (
    <input
      type="datetime-local"
      value={formatDateTimeLocal(value)}
      onChange={handleChange}
      className={className}
    />
  );
};

const MCPDetail = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [refundDate, setRefundDate] = useState(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [refundDates, setRefundDates] = useState({});
  const [handledById, setHandledById] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);


  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPackageDetails(packageId);
        console.log('Fetched package data:', data);
        setPackageData(data);

        const refundedServices = data.services?.filter(s => s.totals.refunded > 0) || [];
        const dates = {};

        for (const service of refundedServices) {
          try {
            const { refund_date } = await api.getRefundDate(packageId);
            dates[service.service_id] = refund_date;
          } catch (err) {
            console.error(`Failed to get refund date for service ${service.service_id}:`, err);
          }
        }

        setRefundDates(dates);
      } catch (error) {
        console.error('Error fetching package details:', error);
        setError('Failed to load package details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackageDetails();
  }, [packageId]);

  // In the initialization useEffect
  useEffect(() => {
    if (packageData?.services) {
      setSelectedServices(packageData.services.map(service => ({
        id: service.detail_id, // Make sure this matches what's in packageData
        detail_id: service.detail_id, // Add this for clarity
        service_id: service.service_id,
        service_name: service.service_name,
        price: service.totals.price,
        discount: service.totals.discount || 1,
        maxQuantity: service.totals.remaining,
        quantity: 0,
        amount: 0
      })));
    }
  }, [packageData]);

  const handleQuantityChange = (detail_id, value) => {
    const numericValue = Math.max(0, Math.min(
      Number(value),
      selectedServices.find(s => s.detail_id === detail_id)?.maxQuantity || 0
    ));

    setSelectedServices(prev => prev.map(service =>
      service.detail_id === detail_id
        ? {
          ...service,
          quantity: numericValue,
          amount: numericValue * service.price * service.discount
        }
        : service
    ));
  };

  // Calculate total directly
  const totalRefundAmount = selectedServices.reduce(
    (sum, service) => sum + service.amount,
    0
  );

  const handleProcessRefund = async () => {
    if (!remarks.trim()) {
      setError('Remarks are required to process the refund');
      return;
    }

    if (!handledById) {
      setError('Please select who is handling this refund');
      return;
    }

    const refundItems = selectedServices
      .filter(service => service.quantity > 0)
      .map(service => ({
        detail_id: Number(service.detail_id), // Convert to number
        quantity: service.quantity
      }));

    if (refundItems.length === 0) {
      setError('Please select at least one service to refund');
      return;
    }

    // Format the refund date properly if using custom date
    let formattedRefundDate = null;
    if (useCustomDate && refundDate) {
      formattedRefundDate = refundDate.toISOString().replace('T', ' ').replace(/\..+/, '') + '+00';
    }

    const requestBody = {
      mcpId: Number(packageId), // Convert to number
      refundedBy: handledById,
      refundRemarks: remarks,
      refundDate: formattedRefundDate,
      refundItems
    };

    console.log('Sending refund request with body:', JSON.stringify(requestBody, null, 2));

    setIsProcessing(true);
    setError(null);
    setSuccessMessage('');

    try {
      await api.processPartialRefund(requestBody);
      // ... rest of your success handling
    } catch (err) {
      console.error('Refund processing failed:', err);
      setError(err.response?.data?.message || 'Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getStatusBadge = (service) => {
    if (service.is_eligible_for_refund === 'refunded') {
      return (
        <span className="inline-flex flex-col items-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Refunded
          </div>
        </span>
      );
    }
    if (service.totals.remaining === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Fully Consumed
        </span>
      );
    }
    if (service.is_eligible_for_refund == 'eligible') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Eligible for Refund
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Review Required
      </span>
    );
  };

  const refundButtonDisabled = isProcessing || !remarks.trim() || !handledById || totalRefundAmount <= 0;

  if (isLoading) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex flex-1 flex-col gap-4 p-4'>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading package details...</p>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex flex-1 flex-col gap-4 p-4'>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Package Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested package could not be located.</p>
                    <button
                      onClick={handleGoBack}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Refunds
                    </button>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                      <button
                        onClick={handleGoBack}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-500">Package ID: {packageId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{packageData.package_name}</h1>
                  <p className="text-gray-600">Process refund and view service details for this package</p>
                </div>

                {successMessage && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <p className="text-green-800 font-medium">{successMessage}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                      <div className="flex items-center mb-4">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900">Refund Details</h2>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <EmployeeSelect
                            name="handled_by"
                            label="Handled By"
                            value={handledById}
                            onChange={(val) => setHandledById(val ? Number(val) : null)}
                            customHeight
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                            Refund Remarks <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter detailed reason for refund"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={4}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Provide clear documentation for audit purposes
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="useCustomDate"
                              checked={useCustomDate}
                              onChange={(e) => setUseCustomDate(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="useCustomDate" className="ml-2 block text-sm text-gray-700">
                              Set custom refund date
                            </label>
                          </div>

                          {useCustomDate && (
                            <div className="mt-2">
                              <label htmlFor="refundDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Refund Date & Time
                              </label>
                              <DateTimePicker
                                value={refundDate}
                                onChange={setRefundDate}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                If not set, current date and time will be used
                              </p>
                            </div>
                          )}
                        </div>

                        {selectedServices.some(s => s.quantity > 0) && (
                          <div className="border-t pt-4 mt-4">
                            <h3 className="font-medium text-gray-900 mb-2">Refund Summary</h3>
                            <div className="space-y-2">
                              {selectedServices
                                .filter(s => s.quantity > 0)
                                .map(service => (
                                  <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <p className="font-medium">{service.service_name}</p>
                                      <p className="text-sm text-gray-600">
                                        {service.quantity} × ${service.price.toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        ${service.amount.toFixed(2)}
                                      </span>
                                      <button
                                        onClick={() => handleQuantityChange(service.detail_id, 0)}
                                        className="ml-2 text-gray-400 hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-bold">Total Refund:</span>
                                <span className="font-bold">${totalRefundAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <button
                            onClick={handleProcessRefund}
                            disabled={refundButtonDisabled}
                            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${refundButtonDisabled
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                              }`}
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing Refund...
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Process Refund (${totalRefundAmount.toFixed(2)})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                            <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
                          </div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Remaining Balance: ${packageData?.balance || '0.00'}
                          </h2>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-6">
                          {packageData?.services?.map((service) => {
                            const selectedService = selectedServices.find(s => s.detail_id === service.detail_id);
                            const maxAvailable = service.totals.remaining;

                            return (
                              <div key={service.detail_idid} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">{service.service_name}</h3>
                                      {service.service_id && (
                                        <p className="text-sm text-gray-600">Service ID: {service.service_id}</p>
                                      )}
                                    </div>
                                    {getStatusBadge(service)}
                                  </div>
                                </div>

                                <div className="p-6">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600">{service.totals.total}</div>
                                      <div className="text-sm text-gray-600">Total</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">{service.totals.consumed}</div>
                                      <div className="text-sm text-gray-600">Consumed</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-red-600">{service.totals.refunded}</div>
                                      <div className="text-sm text-gray-600">Refunded</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-orange-600">{service.totals.remaining}</div>
                                      <div className="text-sm text-gray-600">Remaining</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-600">${(service.totals.price).toFixed(2)}</div>
                                      <div className="text-sm text-gray-600">Unit Price</div>
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Quantity to Refund (Max: {maxAvailable})
                                    </label>
                                    <div className="flex items-center space-x-4">
                                      <input
                                        type="number"
                                        min="0"
                                        max={maxAvailable}
                                        value={selectedService?.quantity || 0}
                                        onChange={(e) => handleQuantityChange(service.detail_id, e.target.value)}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                      />
                                      <span className="text-gray-600">
                                        × ${service.totals.price.toFixed(2)} =
                                        <span className="font-medium ml-1">
                                          ${((selectedService?.quantity || 0) * service.totals.price).toFixed(2)}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default MCPDetail;
