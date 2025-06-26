import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EditPaymentMethodPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    paymentMethod,
    fetchPaymentMethodById,
    updatePaymentMethod,
    isLoading,
    isUpdating
  } = usePaymentMethodStore();
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showRevenueWarning, setShowRevenueWarning] = useState(false);
  const [pendingRevenueValue, setPendingRevenueValue] = useState(null);
  const [updatedPaymentMethod, setUpdatedPaymentMethod] = useState(null);

  const handleGoToPaymentMethods = () => {
    navigate('/payment-method');
  };

  // Helper function to format datetime for input field
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format to YYYY-MM-DDTHH:mm format for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Helper function to validate datetime
  const validateDateTime = (value) => {
    if (!value) return "Creation date and time is required";
    
    try {
      const inputDate = new Date(value);
      const now = new Date();
      
      if (isNaN(inputDate.getTime())) {
        return "Please enter a valid date and time";
      }
      
      // Check if date is not in the future
      if (inputDate > now) {
        return "Creation date cannot be in the future";
      }
      
      // Check if date is not too far in the past (e.g., before year 2000)
      const minDate = new Date('2000-01-01');
      if (inputDate < minDate) {
        return "Creation date cannot be before January 1, 2000";
      }
      
      return true;
    } catch (error) {
      return "Please enter a valid date and time";
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      payment_method_name: '',
      is_enabled: true,
      is_revenue: false,
      show_on_payment_page: true,
      created_at: ''
    }
  });

  // Watch switch values for controlled components
  const isEnabled = watch('is_enabled');
  const isRevenue = watch('is_revenue');
  const showOnPaymentPage = watch('show_on_payment_page');

  // Fetch payment method data on component mount
  useEffect(() => {
    const loadPaymentMethod = async () => {
      if (id) {
        setIsInitialLoading(true);
        const result = await fetchPaymentMethodById(id);

        if (result.success && result.data) {
          const data = result.data;
          // Pre-populate form with existing data
          reset({
            payment_method_name: data.payment_method_name || '',
            is_enabled: data.is_enabled !== undefined ? data.is_enabled : true,
            is_revenue: data.is_revenue !== undefined ? data.is_revenue : false,
            show_on_payment_page: data.show_on_payment_page !== undefined ? data.show_on_payment_page : true,
            created_at: formatDateTimeForInput(data.created_at)
          });
        } else {
          setError(result.error || 'Failed to load payment method');
        }
        setIsInitialLoading(false);
      }
    };

    loadPaymentMethod();
  }, [id, fetchPaymentMethodById, reset]);

  const handleRevenueToggle = (checked) => {
    // Store the pending value and show warning dialog
    setPendingRevenueValue(checked);
    setShowRevenueWarning(true);
  };

  const confirmRevenueChange = () => {
    // Apply the pending revenue value
    setValue('is_revenue', pendingRevenueValue, { shouldDirty: true });
    setShowRevenueWarning(false);
    setPendingRevenueValue(null);
  };

  const cancelRevenueChange = () => {
    // Reset and close the dialog
    setShowRevenueWarning(false);
    setPendingRevenueValue(null);
  };

  const onSubmit = async (data) => {
    setError(null);
    
    try {
      // Convert the datetime-local input to ISO string
      const createdAtISO = new Date(data.created_at).toISOString();
      const currentTime = new Date().toISOString();
      
      const result = await updatePaymentMethod(id, {
        ...data,
        created_at: createdAtISO,
        updated_at: currentTime,
      });

      if (result.success) {
        setUpdatedPaymentMethod(result.data);
        console.log(result) // Store updated data for summary
        setShowSuccessDialog(true);           // Show the dialog
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to process the date and time. Please check your input.');
      console.error('Date processing error:', error);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (confirmLeave) {
        navigate('/payment-method');
      }
    } else {
      navigate('/payment-method');
    }
  };

  // Show loading spinner while fetching initial data
  if (isInitialLoading) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className="w-full max-w-none p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-gray-600">Loading payment method...</span>
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
            <div className="w-full max-w-none p-6">
              {/* Header Section */}
              <div className="flex items-center gap-3 mb-6">
                <Link to="/payment-method">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Edit Payment Method</h1>
                  <p className="text-sm text-gray-600 mt-1">Update payment method settings</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Payment Method Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="payment_method_name" className="text-sm font-medium text-gray-700">
                          Payment Method Name *
                        </Label>
                        <Input
                          id="payment_method_name"
                          placeholder="Enter payment method name (e.g., Credit Card, PayPal, Bank Transfer)"
                          {...register("payment_method_name", {
                            required: "Payment method name is required",
                            minLength: {
                              value: 2,
                              message: "Payment method name must be at least 2 characters"
                            },
                            maxLength: {
                              value: 100,
                              message: "Payment method name must not exceed 100 characters"
                            },
                            pattern: {
                              value: /^[a-zA-Z0-9\s\-_&()]+$/,
                              message: "Payment method name contains invalid characters"
                            }
                          })}
                          className={errors.payment_method_name ? "border-red-500" : ""}
                        />
                        {errors.payment_method_name && (
                          <p className="text-red-500 text-xs">{errors.payment_method_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="created_at" className="text-sm font-medium text-gray-700">
                          Creation Date & Time *
                        </Label>
                        <Input
                          id="created_at"
                          type="datetime-local"
                          {...register("created_at", {
                            required: "Creation date and time is required",
                            validate: validateDateTime
                          })}
                          className={errors.created_at ? "border-red-500" : ""}
                          max={formatDateTimeForInput(new Date().toISOString())} // Prevent future dates
                        />
                        {errors.created_at && (
                          <p className="text-red-500 text-xs">{errors.created_at.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Specify when this payment method was originally created. Cannot be in the future.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Configuration Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Is Enabled Switch */}
                      <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
                            Enable Payment Method
                          </Label>
                          <p className="text-xs text-gray-500">
                            Allow this payment method to be used
                          </p>
                        </div>
                        <Switch
                          id="is_enabled"
                          checked={isEnabled}
                          onCheckedChange={(checked) => setValue('is_enabled', checked, { shouldDirty: true })}
                        />
                      </div>

                      {/* Is Revenue Switch */}
                      <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="is_revenue" className="text-sm font-medium text-gray-700">
                            Revenue Generating
                          </Label>
                          <p className="text-xs text-gray-500">
                            This payment method generates revenue
                          </p>
                        </div>
                        <Switch
                          id="is_revenue"
                          checked={isRevenue}
                          onCheckedChange={handleRevenueToggle}
                        />
                      </div>

                      {/* Show on Payment Page Switch */}
                      <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="show_on_payment_page" className="text-sm font-medium text-gray-700">
                            Show on Payment Page
                          </Label>
                          <p className="text-xs text-gray-500">
                            Display this option to customers
                          </p>
                        </div>
                        <Switch
                          id="show_on_payment_page"
                          checked={showOnPaymentPage}
                          onCheckedChange={(checked) => setValue('show_on_payment_page', checked, { shouldDirty: true })}
                        />
                      </div>
                    </div>

                    {/* Configuration Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className={isEnabled ? 'text-green-700' : 'text-gray-600'}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isRevenue ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                          <span className={isRevenue ? 'text-blue-700' : 'text-gray-600'}>
                            {isRevenue ? 'Revenue Source' : 'Non-Revenue'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${showOnPaymentPage ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                          <span className={showOnPaymentPage ? 'text-purple-700' : 'text-gray-600'}>
                            {showOnPaymentPage ? 'Visible to Customers' : 'Hidden from Customers'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-red-800 text-sm font-medium">Error</p>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    All fields marked with * are required
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="px-8 py-3 text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating || !isDirty}
                      className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Payment Method"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </SidebarInset>
        </div>

        {/* Revenue Warning Dialog */}
        <Dialog open={showRevenueWarning} onOpenChange={setShowRevenueWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Revenue Setting Warning
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700 mb-4">
                Changing the revenue setting for this payment method may affect your revenue reports and financial calculations.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Impact:</strong> This change will affect how transactions using this payment method are calculated in revenue sheets and financial reports.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to {pendingRevenueValue ? 'enable' : 'disable'} revenue generation for this payment method?
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelRevenueChange}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRevenueChange}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Payment Method Updated Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Your payment method "{updatedPaymentMethod?.payment_method_name}" has been updated successfully.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${updatedPaymentMethod?.is_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {updatedPaymentMethod?.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue Generating:</span>
                  <span className={`font-medium ${updatedPaymentMethod?.is_revenue ? 'text-blue-600' : 'text-gray-600'}`}>
                    {updatedPaymentMethod?.is_revenue ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Visible to Customers:</span>
                  <span className={`font-medium ${updatedPaymentMethod?.show_on_payment_page ? 'text-purple-600' : 'text-gray-600'}`}>
                    {updatedPaymentMethod?.show_on_payment_page ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {updatedPaymentMethod?.created_at ? new Date(updatedPaymentMethod.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button onClick={handleGoToPaymentMethods} className="bg-blue-600 hover:bg-blue-700">
                Back to Payment Methods
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </div>
  );
};

export default EditPaymentMethodPage;