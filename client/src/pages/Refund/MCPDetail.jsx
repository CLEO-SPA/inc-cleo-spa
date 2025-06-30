import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, DollarSign, Package, FileText, Clock, Calendar } from 'lucide-react';
import api from '@/services/refundService';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPackageDetails(packageId);
        setPackageData(data);
        
        // Fetch refund dates for refunded services
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

  const handleProcessRefund = async (serviceId) => {
    if (!remarks.trim()) {
      setError('Remarks are required to process the refund');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage('');

    try {
      await api.processRefund(
        packageId, 
        remarks,
        useCustomDate ? refundDate : null
      );
      const updatedData = await api.getPackageDetails(packageId);
      setPackageData(updatedData);
      setRemarks('');
      setRefundDate(null);
      setUseCustomDate(false);
      setSuccessMessage('Refund has been processed successfully');
      
      // Refresh refund dates after successful refund
      const { refund_date } = await api.getRefundDate(packageId);
      setRefundDates(prev => ({
        ...prev,
        [serviceId]: refund_date
      }));
      
      setTimeout(() => {
        setSuccessMessage('');
        navigate(-1);
      }, 2000);
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
    if (service.totals.refunded > 0) {
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
    if (service.is_eligible_for_refund) {
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
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                          <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-6">
                          {packageData.services?.map((service) => (
                            <div key={service.service_id} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{service.service_name}</h3>
                                    <p className="text-sm text-gray-600">Service ID: {service.service_id}</p>
                                  </div>
                                  {getStatusBadge(service)}
                                </div>
                              </div>

                              <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{service.totals.purchased}</div>
                                    <div className="text-sm text-gray-600">Purchased</div>
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
                                </div>

                                <div className="mb-6">
                                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Usage Progress</span>
                                    <span>
                                      {Math.round((service.totals.consumed / service.totals.purchased) * 100)}% utilized
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${Math.min((service.totals.consumed / service.totals.purchased) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {service.totals.refunded > 0 && refundDates[service.service_id] && (
                                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-center text-purple-800">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      <span className="font-medium">Refund processed:</span>
                                      <span className="ml-2">
                                        {new Date(refundDates[service.service_id]).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end">
                                  {service.totals.refunded > 0 ? (
                                    <div className="text-right">
                                      <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        <span>Refunded</span>
                                      </div>
                                    </div>
                                  ) : service.is_eligible_for_refund === "ineligible" ? (
                                    <button
                                      disabled
                                      className="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Ineligible for Refund
                                    </button>
                                  ) : service.is_eligible_for_refund ? (
                                    <button
                                      onClick={() => handleProcessRefund(service.service_id)}
                                      disabled={isProcessing || !remarks.trim()}
                                      className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                        isProcessing || !remarks.trim()
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
                                          Process Refund
                                        </>
                                      )}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
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