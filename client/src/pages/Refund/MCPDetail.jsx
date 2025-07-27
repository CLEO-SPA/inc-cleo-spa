import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, DollarSign, Package, FileText, Clock, Calendar, X } from 'lucide-react';
import api from '@/services/refundService';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';

const DateTimePicker = ({ value, onChange, className, packageCreatedAt }) => {
  const [error, setError] = useState(null);

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
      const newDate = new Date(dateTimeValue);

      // Validate against package creation date
      if (packageCreatedAt && newDate < packageCreatedAt) {
        setError("Cannot be before package creation date");
      } else {
        setError(null);
      }

      onChange(newDate);
    } else {
      onChange(null);
    }
  };

  return (
    <div>
      <input
        type="datetime-local"
        value={formatDateTimeLocal(value)}
        onChange={handleChange}
        className={`${className} ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 text-lg">Loading package details...</p>
    </div>
  </div>
);

const NotFoundState = ({ onBack }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Package Not Found</h2>
      <p className="text-gray-600 mb-6">The requested package could not be located.</p>
      <button
        onClick={onBack}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Refunds
      </button>
    </div>
  </div>
);

const HeaderSection = ({ packageId, onBack }) => (
  <div className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          <button
            onClick={onBack}
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
);

const RefundDetailsSection = ({
  handledById,
  setHandledById,
  remarks,
  setRemarks,
  additionalBalanceRefund,
  setAdditionalBalanceRefund,
  packageBalance,
  useCustomDate,
  setUseCustomDate,
  refundDate,
  setRefundDate,
  selectedServices,
  totalRefundAmount,
  handleProcessRefund,
  refundButtonDisabled,
  isProcessing,
  maxAdditionalRefund,
  handleQuantityChange,
}) => (
  <div className="lg:col-span-1">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Refund Details</h2>
      </div>
      <div className="space-y-4">
        <EmployeeSelect
          name="handled_by"
          label="Handled By"
          value={handledById}
          onChange={(val) => setHandledById(val ? Number(val) : null)}
          customHeight
          className="w-full"
        />

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

        <div>
          <label htmlFor="additionalBalance" className="block text-sm font-medium text-gray-700 mb-2">
            Balance Refund
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="additionalBalance"
              min="0"
              max={maxAdditionalRefund()}
              step="0.01"
              value={additionalBalanceRefund}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setAdditionalBalanceRefund(Math.min(
                  isNaN(value) ? 0 : value,
                  maxAdditionalRefund()
                ));
              }}
              className="block w-full pl-7 pr-2.5 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-7 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                Max: ${maxAdditionalRefund().toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter an amount to refund from remaining balance
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

        {(selectedServices.some(s => s.quantity > 0) || additionalBalanceRefund > 0) && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Refund Summary</h3>
            <div className="space-y-2">
              {selectedServices
                .filter(s => s.quantity > 0)
                .map(service => (
                  <div key={service.detail_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
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

              {additionalBalanceRefund > 0 && (
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Additional Balance Refund</p>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">
                      ${Number(additionalBalanceRefund).toFixed(2)}
                    </span>
                    <button
                      onClick={() => setAdditionalBalanceRefund(0)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold">Total Refund Amount:</span>
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
);

const ServiceDetailsSection = ({
  packageData,
  selectedServices,
  handleQuantityChange,
  getStatusBadge,
  maxServiceQuantity
}) => (
  <div className="lg:col-span-2">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Remaining Balance: ${packageData.balance || '0.00'}
          </h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {packageData?.services?.map((service) => {
            const selectedService = selectedServices.find(s => s.detail_id === service.detail_id);
            const maxAvailable = maxServiceQuantity(service);

            return (
              <div key={`service-${service.detail_id}`} className="border border-gray-200 rounded-lg overflow-hidden">
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
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold text-blue-600">{service.totals.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold text-green-600">{service.totals.consumed}</div>
                      <div className="text-sm text-gray-600">Consumed</div>
                    </div>
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold text-red-600">{service.totals.refunded}</div>
                      <div className="text-sm text-gray-600">Refunded</div>
                    </div>
                    <div className="text-center p-2">
                      <div className="text-2xl font-bold">${(service.totals.price).toFixed(2)}</div>
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
                          ${((selectedService?.quantity || 0) * service.totals.price * (service.totals.discount || 1)).toFixed(2)}
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
);

const MainContent = ({
  packageData,
  successMessage,
  error,
  selectedServices,
  additionalBalanceRefund,
  setAdditionalBalanceRefund,
  handleQuantityChange,
  totalRefundAmount,
  handleProcessRefund,
  refundButtonDisabled,
  isProcessing,
  handledById,
  setHandledById,
  remarks,
  setRemarks,
  useCustomDate,
  setUseCustomDate,
  refundDate,
  setRefundDate,
  getStatusBadge,
  maxAdditionalRefund,
  maxServiceQuantity
}) => (
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
      <RefundDetailsSection
        handledById={handledById}
        setHandledById={setHandledById}
        remarks={remarks}
        setRemarks={setRemarks}
        additionalBalanceRefund={additionalBalanceRefund}
        setAdditionalBalanceRefund={setAdditionalBalanceRefund}
        packageBalance={packageData.balance}
        useCustomDate={useCustomDate}
        setUseCustomDate={setUseCustomDate}
        refundDate={refundDate}
        setRefundDate={setRefundDate}
        selectedServices={selectedServices}
        totalRefundAmount={totalRefundAmount}
        handleProcessRefund={handleProcessRefund}
        refundButtonDisabled={refundButtonDisabled}
        isProcessing={isProcessing}
        maxAdditionalRefund={maxAdditionalRefund}
        handleQuantityChange={handleQuantityChange}
      />

      <ServiceDetailsSection
        packageData={packageData}
        selectedServices={selectedServices}
        handleQuantityChange={handleQuantityChange}
        getStatusBadge={getStatusBadge}
        maxServiceQuantity={maxServiceQuantity}
      />
    </div>
  </div>
);

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
  const [additionalBalanceRefund, setAdditionalBalanceRefund] = useState(0);

  // Calculate the current remaining balance after all selected services
  const calculateRemainingBalance = () => {
    const servicesTotal = selectedServices.reduce(
      (sum, service) => sum + service.amount,
      0
    );
    return Math.max(0, packageData.balance - servicesTotal - additionalBalanceRefund);
  };

  // Calculate max additional refund amount
  const maxAdditionalRefund = () => {
    const servicesTotal = selectedServices.reduce(
      (sum, service) => sum + service.amount,
      0
    );
    return Math.max(0, packageData?.balance - servicesTotal) || 0;
  };

  // Calculate max service quantity based on remaining balance and service availability
  const maxServiceQuantity = (service) => {
    // Find the current selected quantity for this service
    const selectedService = selectedServices.find(s => s.detail_id === service.detail_id);
    const currentQuantity = selectedService ? selectedService.quantity : 0;

    // Calculate total cost of OTHER selected services (excluding this one)
    const otherServicesTotal = selectedServices
      .filter(s => s.detail_id !== service.detail_id)
      .reduce((sum, s) => sum + s.amount, 0);

    // Calculate remaining balance after other services and additional balance refund
    const remainingBalance = Math.max(0, packageData.balance - otherServicesTotal - additionalBalanceRefund);

    // Calculate max quantity from balance constraint
    const maxFromBalance = Math.floor(remainingBalance / (service.totals.price * (service.totals.discount || 1)));

    // Max quantity is the minimum of remaining service quantity and what balance allows
    const maxQuantity = Math.min(service.totals.remaining, maxFromBalance);

    return Math.max(0, maxQuantity);
  };

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPackageDetails(packageId);
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

  useEffect(() => {
    if (packageData?.services) {
      setSelectedServices(packageData.services.map(service => ({
        detail_id: service.detail_id,
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

  // Updated handleQuantityChange function
  const handleQuantityChange = (detail_id, value) => {
    const numericValue = Math.max(0, isNaN(Number(value)) ? 0 : Number(value));

    setSelectedServices(prevServices => {
      return prevServices.map(service => {
        if (service.detail_id === detail_id) {
          // Find the corresponding service from packageData to get current max
          const packageService = packageData.services.find(s => s.detail_id === detail_id);
          if (!packageService) return service;

          // Calculate max for this specific service
          const maxQty = maxServiceQuantity(packageService);
          const finalQuantity = Math.min(numericValue, maxQty);

          return {
            ...service,
            quantity: finalQuantity,
            amount: finalQuantity * service.price * service.discount
          };
        }
        return service;
      });
    });
  };

  const totalRefundAmount = selectedServices.reduce(
    (sum, service) => sum + service.amount,
    0
  ) + additionalBalanceRefund;

  const handleAdditionalBalanceChange = (value) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    const maxAllowed = maxAdditionalRefund();
    setAdditionalBalanceRefund(Math.min(isNaN(numericValue) ? 0 : numericValue, maxAllowed));
  };

  const handleProcessRefund = async () => {
    if (!remarks.trim()) {
      setError('Remarks are required to process the refund');
      return;
    }

    if (!handledById) {
      setError('Please select who is handling this refund');
      return;
    }

    if (additionalBalanceRefund <= 0 && selectedServices.every(s => s.quantity <= 0)) {
      setError('Please enter a balance amount or select service quantities to refund');
      return;
    }

    if (totalRefundAmount > packageData.balance) {
      setError(`Total refund amount cannot exceed remaining balance of $${packageData.balance}`);
      return;
    }

    // NEW VALIDATION: Check if refund date is before package creation date
    if (useCustomDate && refundDate) {
      const packageCreatedAt = new Date(packageData.created_at);
      if (refundDate < packageCreatedAt) {
        setError("The refund date cannot be before the member care package's creation date");
        return;
      }
    }

    const refundItems = selectedServices.map(service => ({
      detail_id: Number(service.detail_id),
      quantity: service.quantity
    }));

    let formattedRefundDate = null;
    if (useCustomDate && refundDate) {
      formattedRefundDate = refundDate.toISOString().replace('T', ' ').replace(/\..+/, '') + '+00';
    }

    const requestBody = {
      mcpId: Number(packageId),
      refundedBy: handledById,
      refundRemarks: remarks,
      refundDate: formattedRefundDate,
      refundItems,
      additionalBalanceRefund: Number(additionalBalanceRefund) || 0
    };

    setIsProcessing(true);
    setError(null);
    setSuccessMessage('');

    try {
      await api.processPartialRefund(requestBody);
      setSuccessMessage('Refund processed successfully!');

      setTimeout(async () => {
        try {
          setIsLoading(true);
          const data = await api.getPackageDetails(packageId);
          setPackageData(data);
          setSelectedServices(data.services.map(service => ({
            detail_id: service.detail_id,
            service_id: service.service_id,
            service_name: service.service_name,
            price: service.totals.price,
            discount: service.totals.discount || 1,
            maxQuantity: service.totals.remaining,
            quantity: 0,
            amount: 0
          })));
          setRemarks('');
          setAdditionalBalanceRefund(0);
          setRefundDate(null);
          setUseCustomDate(false);
          setSuccessMessage('');
        } catch (error) {
          console.error('Error refreshing package details:', error);
        } finally {
          setIsLoading(false);
        }
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
  // Calculate initial max available when nothing else is selected
  const initialMaxAvailable = Math.min(
    service.totals.remaining,
    Math.floor(packageData.balance / (service.totals.price * (service.totals.discount || 1)))
  );

  return initialMaxAvailable > 0 ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" />
      Eligible for Refund
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <AlertCircle className="w-3 h-3 mr-1" />
      Ineligible for Refund
    </span>
  );
};

  const refundButtonDisabled = isProcessing || !remarks.trim() || !handledById ||
    (additionalBalanceRefund <= 0 && selectedServices.every(s => s.quantity <= 0));

  if (isLoading) {
    return <LoadingState />;
  }

  if (!packageData) {
    return <NotFoundState onBack={handleGoBack} />;
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <HeaderSection packageId={packageId} onBack={handleGoBack} />

              <MainContent
                packageData={packageData}
                successMessage={successMessage}
                error={error}
                selectedServices={selectedServices}
                additionalBalanceRefund={additionalBalanceRefund}
                setAdditionalBalanceRefund={handleAdditionalBalanceChange}
                handleQuantityChange={handleQuantityChange}
                totalRefundAmount={totalRefundAmount}
                handleProcessRefund={handleProcessRefund}
                refundButtonDisabled={refundButtonDisabled}
                isProcessing={isProcessing}
                handledById={handledById}
                setHandledById={setHandledById}
                remarks={remarks}
                setRemarks={setRemarks}
                useCustomDate={useCustomDate}
                setUseCustomDate={setUseCustomDate}
                refundDate={refundDate}
                setRefundDate={setRefundDate}
                getStatusBadge={getStatusBadge}
                maxAdditionalRefund={maxAdditionalRefund}
                maxServiceQuantity={maxServiceQuantity}
              />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default MCPDetail;