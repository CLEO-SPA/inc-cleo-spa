// src/pages/UpdateEmployeePage.jsx
import { useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import PositionSelect from '@/components/ui/forms/PositionSelect';
import useEmployeeStore from '@/stores/useEmployeeStore';

/* -------------------- util helpers -------------------- */
const pad = (n) => n.toString().padStart(2, '0');
const isoToLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const todayAt10am = () => {
  const now = new Date();
  now.setHours(10, 0, 0, 0);
  return isoToLocalInput(now.toISOString());
};

/* -------------------- component -------------------- */
export default function UpdateEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getEmployeeById,
    updateEmployee,
    currentEmployee,
    isFetchingOne,
    isUpdating,
    success,
    error,
    resetMessages,
  } = useEmployeeStore();

  const defaultValues = useMemo(() => {
    if (!currentEmployee) return {};
    return {
      employee_name: currentEmployee.employee_name || '',
      employee_email: currentEmployee.employee_email || '',
      employee_contact: currentEmployee.employee_contact || '',
      employee_code: currentEmployee.employee_code || '',
      employee_is_active: !!currentEmployee.employee_is_active,
      position_ids: currentEmployee.position_ids?.map(String) || [],
      created_at_display: isoToLocalInput(currentEmployee.created_at),
      updated_at: todayAt10am(),
    };
  }, [currentEmployee]);

  const methods = useForm({ defaultValues });
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    resetMessages();
    getEmployeeById(id);
  }, [id]);

  useEffect(() => {
    if (currentEmployee) reset(defaultValues);
  }, [currentEmployee]);

  const onSubmit = async (data) => {
    await updateEmployee(id, {
      employee_name: data.employee_name,
      employee_email: data.employee_email,
      employee_contact: data.employee_contact,
      employee_code: data.employee_code,
      employee_is_active: data.employee_is_active,
      position_ids: data.position_ids,
      updated_at: new Date(data.updated_at).toISOString(),
    });
  };

  if (isFetchingOne && !currentEmployee)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (!currentEmployee && !isFetchingOne)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Employee not found.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="p-4 max-w-2xl w-full flex flex-col gap-4">
              <h1 className="text-2xl font-bold">Edit Employee</h1>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="employee_name">Full Name *</Label>
                        <Input id="employee_name" {...register('employee_name', { required: 'Full Name is required' })} />
                        {errors.employee_name && <p className="text-red-500 text-xs mt-1">{errors.employee_name.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="employee_email">Email *</Label>
                        <Input id="employee_email" type="email" {...register('employee_email', { required: 'Email is required' })} />
                        {errors.employee_email && <p className="text-red-500 text-xs mt-1">{errors.employee_email.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="employee_contact">Contact *</Label>
                        <Input id="employee_contact" {...register('employee_contact', { required: 'Contact is required' })} />
                        {errors.employee_contact && <p className="text-red-500 text-xs mt-1">{errors.employee_contact.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="employee_code">Employee Code *</Label>
                        <Input id="employee_code" {...register('employee_code', { required: 'Employee Code is required' })} />
                        {errors.employee_code && <p className="text-red-500 text-xs mt-1">{errors.employee_code.message}</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          id="employee_is_active"
                          checked={methods.watch('employee_is_active')}
                          onCheckedChange={(v) => methods.setValue('employee_is_active', v)}
                        />
                        <Label htmlFor="employee_is_active">Active</Label>
                      </div>

                      <div>
                        <Label className="mb-3 block">Assign Positions</Label>
                        <PositionSelect name="position_ids" isMulti />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="created_at_display">Creation Time</Label>
                        <Input id="created_at_display" disabled type="datetime-local" readOnly value={methods.watch('created_at_display')} />
                      </div>

                      <div>
                        <Label htmlFor="updated_at">Update Time *</Label>
                        <Controller
                          control={control}
                          name="updated_at"
                          rules={{ required: 'Update time is required' }}
                          render={({ field }) => (
                            <Input id="updated_at" type="datetime-local" {...field} />
                          )}
                        />
                        {errors.updated_at && <p className="text-red-500 text-xs mt-1">{errors.updated_at.message}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={isUpdating === Number(id)} className="w-full">
                    {isUpdating === Number(id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
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
