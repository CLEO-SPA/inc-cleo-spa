import { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { DateTimeSelector } from '@/components/custom/DateTimeSelector';
import PositionSelect from '@/components/ui/forms/PositionSelect';

import useEmployeeStore from '@/stores/useEmployeeStore';

/* --------------------- helper: local 10:00 string --------------------- */
const todayAtTenString = () => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function CreateEmployeePage() {
  const {
    createEmployee,
    isCreating: loading,
    error,
    success,
    resetMessages,
    employeeData,
  } = useEmployeeStore();

  const methods = useForm({
    defaultValues: {
      ...employeeData,
      created_at: todayAtTenString(),
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = methods;

  useEffect(() => {
    return () => resetMessages();
  }, [resetMessages]);

  const onSubmit = async (data) => {
    try {
      await createEmployee(data);
      reset({ ...employeeData, created_at: todayAtTenString() });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4 max-w-2xl'>
              <h1 className='text-2xl font-bold'>Add New Employee</h1>

              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant='success'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* --------------------- FORM --------------------- */}
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>

                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>

                      {/* Full Name */}
                      <div>
                        <Label htmlFor='employee_name'>Full Name *</Label>
                        <Input id='employee_name' {...register('employee_name', { required: 'Full Name is required' })} />
                        {errors.employee_name && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_name.message}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor='employee_email'>Email *</Label>
                        <Input id='employee_email' type='email' {...register('employee_email', { required: 'Email is required' })} />
                        {errors.employee_email && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_email.message}</p>
                        )}
                      </div>

                      {/* Contact */}
                      <div>
                        <Label htmlFor='employee_contact'>Contact *</Label>
                        <Input id='employee_contact' {...register('employee_contact', { required: 'Contact is required' })} />
                        {errors.employee_contact && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_contact.message}</p>
                        )}
                      </div>

                      {/* Employee Code */}
                      <div>
                        <Label htmlFor='employee_code'>Employee Code *</Label>
                        <Input id='employee_code' {...register('employee_code', { required: 'Employee Code is required' })} />
                        {errors.employee_code && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_code.message}</p>
                        )}
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Controller
                          name='employee_is_active'
                          control={control}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                        <Label htmlFor='employee_is_active'>Active</Label>
                      </div>


                      {/* Positions */}
                      <div>
                        <Label className='mb-3 block'>Assign Positions</Label>
                        <PositionSelect name='position_ids' isMulti />
                      </div>

                      {/* Creation Time */}
                      <div>
                        <Label className='mb-2 block'>Creation Time *</Label>
                        <Controller
                          name='created_at'
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <DateTimeSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        {errors.created_at && (
                          <p className='text-red-500 text-xs mt-1'>
                            {errors.created_at.message || 'Creation time is required'}
                          </p>
                        )}
                      </div>

                    </CardContent>
                  </Card>

                  <Button type='submit' disabled={loading} className='w-full'>
                    {loading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      'Create Employee'
                    )}
                  </Button>
                </form>
              </FormProvider>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
