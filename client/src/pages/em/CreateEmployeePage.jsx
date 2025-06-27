import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Copy } from 'lucide-react';
import { DateTimeSelector } from '@/components/custom/DateTimeSelector';
import PositionSelect from '@/components/ui/forms/PositionSelect';
import { RoleSelect } from '@/components/ui/forms/RoleSelect';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function CreateEmployeePage() {
  const {
    createAndInviteEmployee,
    isCreating: loading,
    error,
    success,
    resetMessages,
    employeeData,
    inviteLink,
  } = useEmployeeStore();

  const [copied, setCopied] = useState(false);

  const methods = useForm({
    defaultValues: {
      ...employeeData,
      created_at: new Date(),
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = methods;

  useEffect(() => {
    return () => {
      resetMessages();
    };
  }, [resetMessages]);

  useEffect(() => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [inviteLink]);

  const onSubmit = async (data) => {
    try {
      await createAndInviteEmployee(data);
      reset();
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

              {inviteLink && (
                <Alert variant='success' className='mt-4'>
                  <AlertDescription className='flex items-center justify-between'>
                    <input
                      type='text'
                      readOnly
                      value={inviteLink}
                      className='flex-grow bg-transparent text-sm outline-none'
                    />
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        setCopied(true);
                      }}
                    >
                      {copied ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      <div>
                        <Label htmlFor='employee_name' className='mb-2 block'>
                          Full Name *
                        </Label>
                        <Input
                          id='employee_name'
                          {...register('employee_name', { required: 'Full Name is required' })}
                        />
                        {errors.employee_name && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor='employee_email' className='mb-2 block'>
                          Email *
                        </Label>
                        <Input
                          id='employee_email'
                          type='email'
                          {...register('employee_email', { required: 'Email is required' })}
                        />
                        {errors.employee_email && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor='employee_contact' className='mb-2 block'>
                          Contact *
                        </Label>
                        <Input
                          id='employee_contact'
                          {...register('employee_contact', { required: 'Contact is required' })}
                        />
                        {errors.employee_contact && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_contact.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor='employee_code' className='mb-2 block'>
                          Employee Code *
                        </Label>
                        <Input
                          id='employee_code'
                          {...register('employee_code', { required: 'Employee Code is required' })}
                        />
                        {errors.employee_code && (
                          <p className='text-red-500 text-xs mt-1'>{errors.employee_code.message}</p>
                        )}
                      </div>

                      <RoleSelect name='role_name' label='Role *' />

                      <div>
                        <Label className='mb-3 block'>Assign Positions</Label>
                        <PositionSelect name='position_ids' isMulti />
                      </div>

                      <div>
                        <Label htmlFor='created_at' className='mb-2 block'>
                          Creation Time
                        </Label>
                        <DateTimeSelector
                          value={getValues('created_at')}
                          onChange={(val) => setValue('created_at', val)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Button type='submit' disabled={loading} className='w-full'>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Create & Invite Employee'}
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
