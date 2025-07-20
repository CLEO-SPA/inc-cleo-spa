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
import { ArrowLeft, Loader2, AlertTriangle, Shield, Lock } from 'lucide-react';
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
  const [showIncomeWarning, setShowIncomeWarning] = useState(false);
  const [pendingIncomeValue, setPendingIncomeValue] = useState(null);
  const [updatedPaymentMethod, setUpdatedPaymentMethod] = useState(null);
  const [isProtected, setIsProtected] = useState(false);
  const [isGSTMethod, setIsGSTMethod] = useState(false);

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
      is_income: false,
      show_on_payment_page: true,
      created_at: '',
      percentage_rate: 0
    }
  });

  // Watch switch values for controlled components
  const isEnabled = watch('is_enabled');
  const isIncome = watch('is_income');
  const showOnPaymentPage = watch('show_on_payment_page');

  // Fetch payment method data on component mount
  useEffect(() => {
    const loadPaymentMethod = async () => {
      if (id) {
        setIsInitialLoading(true);
        const result = await fetchPaymentMethodById(id);

        if (result.success && result.data) {
          const data = result.data;
          // Check if payment method is protected
          setIsProtected(data.is_protected === true);
          
          // Check if this is GST method (by name or id)
          setIsGSTMethod(
            data.payment_method_name?.toLowerCase() === 'gst' || 
            data.id === 10 || 
            parseInt(id) === 10
          );
          
          // Pre-populate form with existing data
          reset({
            payment_method_name: data.payment_method_name || '',
            is_enabled: data.is_enabled !== undefined ? data.is_enabled : true,
            is_income : data.is_income !== undefined ? data.is_income : false,
            show_on_payment_page: data.show_on_payment_page !== undefined ? data.show_on_payment_page : true,
            created_at: formatDateTimeForInput(data.created_at),
            percentage_rate: data.percentage_rate || 0
          });
        } else {
          setError(result.error || 'Failed to load payment method');
        }
        setIsInitialLoading(false);
      }
    };

    loadPaymentMethod();
  }, [id, fetchPaymentMethodById, reset]);

  const handleIncomeToggle = (checked) => {
    // Prevent changes if protected (unless it's GST method)
    if (isProtected && !isGSTMethod) return;
    
    // Store the pending value and show warning dialog
    setPendingIncomeValue(checked);
    setShowIncomeWarning(true);
  };

  const confirmIncomeChange = () => {
    // Apply the pending income value
    setValue('is_income', pendingIncomeValue, { shouldDirty: true });
    setShowIncomeWarning(false);
    setPendingIncomeValue(null);
  };

  const cancelIncomeChange = () => {
    // Reset and close the dialog
    setShowIncomeWarning(false);
    setPendingIncomeValue(null);
  };

  const onSubmit = async (data) => {
    // Prevent submission if protected (unless it's GST method)
    if (isProtected && !isGSTMethod) {
      setError('This payment method is protected and cannot be modified.');
      return;
    }

    setError(null);
    
    try {
      // Convert the datetime-local input to ISO string
      const createdAtISO = new Date(data.created_at).toISOString();
      const currentTime = new Date().toISOString();
      
      // For GST methods, only allow percentage_rate to be updated
      const updateData = isGSTMethod && isProtected 
        ? { percentage_rate: parseFloat(data.percentage_rate) }
        : {
            ...data,
            created_at: createdAtISO,
            updated_at: currentTime,
            percentage_rate: parseFloat(data.percentage_rate)
          };
      
      const result = await updatePaymentMethod(id, updateData);

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
    if (isDirty && (!isProtected || isGSTMethod)) {
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {isProtected && !isGSTMethod ? 'View Payment Method' : 'Edit Payment Method'}
                    </h1>
                    {isProtected && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        <Shield className="h-3 w-3" />
                        {isGSTMethod ? 'Protected (Rate Editable)' : 'Protected'}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {isProtected && !isGSTMethod
                      ? 'This payment method is protected and cannot be modified'
                      : isProtected && isGSTMethod
                      ? 'This payment method is protected. Only the percentage rate can be modified.'
                      : 'Update payment method settings'
                    }
                  </p>
                </div>
              </div>

              {/* Protection Notice */}
              {isProtected && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-600" />
                    <h3 className="font-medium text-amber-900">Protected Payment Method</h3>
                  </div>
                  <p className="text-sm text-amber-800 mt-2">
                    {isGSTMethod 
                      ? 'This payment method is protected by the system. Only the percentage rate can be modified to adjust GST calculations.'
                      : 'This payment method is protected by the system and cannot be modified or deleted. All fields are read-only to preserve system integrity.'
                    }
                  </p>
                </div>
              )}

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
                          className={`${errors.payment_method_name ? "border-red-500" : ""} ${isProtected ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          disabled={isProtected}
                          readOnly={isProtected}
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
                          className={`${errors.created_at ? "border-red-500" : ""} ${isProtected ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          max={formatDateTimeForInput(new Date().toISOString())} // Prevent future dates
                          disabled={isProtected}
                          readOnly={isProtected}
                        />
                        {errors.created_at && (
                          <p className="text-red-500 text-xs">{errors.created_at.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Specify when this payment method was originally created. Cannot be in the future.
                        </p>
                      </div>
                    </div>

                    {/* Percentage Rate Field - Only for GST method */}
                    {isGSTMethod && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2">
                          <Label htmlFor="percentage_rate" className="text-sm font-medium text-gray-700">
                            Percentage Rate (%) *
                          </Label>
                          <Input
                            id="percentage_rate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Enter percentage rate (e.g., 10.00)"
                            {...register("percentage_rate", {
                              required: "Percentage rate is required",
                              min: {
                                value: 0,
                                message: "Percentage rate must be 0 or greater"
                              },
                              max: {
                                value: 100,
                                message: "Percentage rate cannot exceed 100%"
                              },
                              pattern: {
                                value: /^\d+\.?\d*$/,
                                message: "Please enter a valid percentage rate"
                              }
                            })}
                            className={`${errors.percentage_rate ? "border-red-500" : ""} ${!isGSTMethod ? "bg-gray-50 cursor-not-allowed" : ""}`}
                            disabled={!isGSTMethod}
                          />
                          {errors.percentage_rate && (
                            <p className="text-red-500 text-xs">{errors.percentage_rate.message}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            The percentage rate applied for GST calculations. Enter as a decimal (e.g., 10.00 for 10%).
                          </p>
                        </div>
                      </div>
                    )}
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
                      <div className={`flex items-center justify-between space-x-2 p-4 border rounded-lg ${isProtected ? 'bg-gray-50' : ''}`}>
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
                          onCheckedChange={(checked) => !(isProtected) && setValue('is_enabled', checked, { shouldDirty: true })}
                          disabled={isProtected}
                        />
                      </div>

                      {/* Is Income Switch */}
                      <div className={`flex items-center justify-between space-x-2 p-4 border rounded-lg ${isProtected ? 'bg-gray-50' : ''}`}>
                        <div className="space-y-1">
                          <Label htmlFor="is_income" className="text-sm font-medium text-gray-700">
                            Income Generating
                          </Label>
                          <p className="text-xs text-gray-500">
                            This payment method generates income
                          </p>
                        </div>
                        <Switch
                          id="is_income"
                          checked={isIncome}
                          onCheckedChange={handleIncomeToggle}
                          disabled={isProtected}
                        />
                      </div>

                      {/* Show on Payment Page Switch */}
                      <div className={`flex items-center justify-between space-x-2 p-4 border rounded-lg ${isProtected ? 'bg-gray-50' : ''}`}>
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
                          onCheckedChange={(checked) => !(isProtected) && setValue('show_on_payment_page', checked, { shouldDirty: true })}
                          disabled={isProtected}
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
                          <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                          <span className={isIncome ? 'text-blue-700' : 'text-gray-600'}>
                            {isIncome ? 'Income Source' : 'Non-Income Source'}
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
                    {isProtected && !isGSTMethod
                      ? 'This payment method is protected and cannot be modified'
                      : isProtected && isGSTMethod
                      ? 'Only the percentage rate can be modified for this protected payment method'
                      : 'All fields marked with * are required'
                    }
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="px-8 py-3 text-base"
                    >
                      {isProtected && !isGSTMethod ? 'Back' : 'Cancel'}
                    </Button>
                    {(!isProtected || isGSTMethod) && (
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
                          isGSTMethod && isProtected ? "Update Rate" : "Update Payment Method"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </SidebarInset>
        </div>

        {/* Income Warning Dialog */}
        <Dialog open={showIncomeWarning} onOpenChange={setShowIncomeWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Income Setting Warning
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700 mb-4">
                Changing the income setting for this payment method may affect your income reports and financial calculations.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Impact:</strong> This change will affect how transactions using this payment method are calculated in income sheets and financial reports.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to {pendingIncomeValue ? 'enable' : 'disable'} income generation for this payment method?
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelIncomeChange}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmIncomeChange}
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
                  <span className="text-gray-600">Income Generating:</span>
                  <span className={`font-medium ${updatedPaymentMethod?.is_income ? 'text-blue-600' : 'text-gray-600'}`}>
                    {updatedPaymentMethod?.is_income ? 'Yes' : 'No'}
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