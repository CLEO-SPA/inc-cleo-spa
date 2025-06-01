import { useForm } from 'react-hook-form';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';


const CreatePaymentMethodPage = () => {
  const { createPaymentMethod, isCreating } = usePaymentMethodStore();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      payment_method_name: '',
      is_enabled: true,
      is_revenue: false,
      show_on_payment_page: true
    }
  });

  // Watch switch values for controlled components
  const isEnabled = watch('is_enabled');
  const isRevenue = watch('is_revenue');
  const showOnPaymentPage = watch('show_on_payment_page');

  const onSubmit = async (data) => {
    setError(null);
    const timestamp = new Date().toISOString();

    const result = await createPaymentMethod({
      ...data,
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (result.success) {
      reset();
    } else {
      setError(result.error);
    }
  };

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
                  <h1 className="text-2xl font-semibold text-gray-900">Create New Payment Method</h1>
                  <p className="text-sm text-gray-600 mt-1">Add a new payment method to the system</p>
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
                            }
                          })} 
                          className={errors.payment_method_name ? "border-red-500" : ""}
                        />
                        {errors.payment_method_name && (
                          <p className="text-red-500 text-xs">{errors.payment_method_name.message}</p>
                        )}
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
                          onCheckedChange={(checked) => setValue('is_enabled', checked)}
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
                          onCheckedChange={(checked) => setValue('is_revenue', checked)}
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
                          onCheckedChange={(checked) => setValue('show_on_payment_page', checked)}
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
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    All fields marked with * are required
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isCreating} 
                    className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
                  >
                    {isCreating ? "Creating Payment Method..." : "Create Payment Method"}
                  </Button>
                </div>
              </form>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CreatePaymentMethodPage;