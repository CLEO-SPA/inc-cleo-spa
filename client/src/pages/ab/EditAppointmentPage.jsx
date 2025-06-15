// src/pages/EditAppointmentPage.jsx
import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from '@/components/ui/forms/MemberSelect';
import AppointmentDateTimeSelect from '@/components/ui/forms/AppointmentDateTimeSelect';
import useAppointmentDateTimeStore from '@/stores/useAppointmentDateTimeStore';
import useAppointmentStore from '@/stores/useAppointmentStore';

const EditAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchAppointment,
    selectedAppointment,
    isFetching,
    isUpdating,
    error: storeError,
    errorMessage: storeErrorMessage,
    reset: resetAppointmentStore,
  } = useAppointmentStore();

  const {
    appointmentWarnings,
    reset: resetDateTimeStore,
    clearWarningForAppointment,
    shiftAppointmentWarnings,
    clearTimeslots,
    getRestDayConflictMessage,
    fetchTimeslots,
    fetchEndTimesForStartTime,
  } = useAppointmentDateTimeStore();

  const methods = useForm({
    defaultValues: {
      member_id: '',
      // appointment object
      appointment: {
        id: '',
        servicing_employee_id: '',
        appointment_date: '',
        start_time: '',
        end_time: '',
        remarks: '',
      },
      created_by: '',
      created_at: '',
      updated_by: '',
      updated_at: '',
    },
  });
  const { handleSubmit, watch, setValue, reset } = methods;
  const formData = watch();

  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper to convert an ISO datetime (UTC) into local "YYYY-MM-DDThh:mm"
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const dt = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, '0');
    const year = dt.getFullYear();
    const month = pad(dt.getMonth() + 1);
    const date = pad(dt.getDate());
    const hours = pad(dt.getHours());
    const minutes = pad(dt.getMinutes());
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  };

  // 1. Load appointment when `id` changes
  useEffect(() => {
    const loadAppointment = async () => {
      if (!id) {
        setLocalError('Appointment ID is required');
        return;
      }
      try {
        setLocalError(null);
        await fetchAppointment(id);
      } catch (err) {
        setLocalError('Failed to load appointment data');
        console.error('Error loading appointment:', err);
      }
    };
    loadAppointment();
  }, [id, fetchAppointment]);

  // 2. Reset form when the store’s appointment changes
  useEffect(() => {
    if (selectedAppointment) {
      console.log('Selected appointment data:', selectedAppointment);

      const appt = selectedAppointment;

      reset({
        member_id: appt.member_id?.toString() || '',
        appointment: {
          id: appt.id,
          servicing_employee_id: appt.servicing_employee_id?.toString() || '',
          appointment_date: appt.appointment_date,
          start_time: appt.start_time,  
          end_time: appt.end_time,
          remarks: appt.remarks || '',
        },
        created_by: appt.created_by?.toString() || '',
        created_at: formatDateTimeLocal(appt.created_at),
        updated_by: '',
        updated_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });

      resetDateTimeStore();
    }
  }, [selectedAppointment, reset, resetDateTimeStore]);

  // 3. Cleanup *only* on unmount
  useEffect(() => {
    return () => {
      resetAppointmentStore();
    };
  }, [resetAppointmentStore]);

  // Validation logic 
  const validateForm = (data) => {
    if (!data.member_id) return 'Please select a member';
    if (!data.updated_at) return 'Please select update date and time';
    if (!data.updated_by) return 'Please select updater';

    const appt = data.appointment;
    // rest-day conflict: single appointment
    const warning = getRestDayConflictMessage(1, true);
    if (warning) return warning;

    if (!appt.servicing_employee_id) return 'Please select a servicing employee';
    if (!appt.appointment_date) return 'Please select appointment date';
    if (appt.start_time == null || appt.start_time.trim() === '') {
      return 'Please select a start time';
    }
    if (appt.end_time == null || appt.end_time.trim() === '') {
      return 'Please select an end time';
    }
    if (appt.start_time >= appt.end_time) {
      return 'End time must be after start time';
    }
    if (!appt.remarks) return 'Please enter remarks';
    return null;
  };

  // Handlers
  const handleInputChange = (field, value) => {
    setValue(field, value);
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const handleAppointmentChange = (field, value) => {
    setValue(`appointment.${field}`, value);
    if (field === 'appointment_date') {
      clearWarningForAppointment(0); // index 0
    }
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const handleEmployeeChange = (field, value) => {
    setValue(`appointment.${field}`, value);
    if (field === 'servicing_employee_id') {
      // clear times and warnings
      setValue('appointment.start_time', '');
      setValue('appointment.end_time', '');
      clearWarningForAppointment(0);
      clearTimeslots(0);
    }
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const onSubmit = async (data) => {
    const validationError = validateForm(data);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError('');
    // Build payload for updateAppointment (store expects array)
    const appt = data.appointment;
    const payload = {
      member_id: parseInt(data.member_id, 10),
      appointment:
      {
        id: appt.id,
        servicing_employee_id: parseInt(appt.servicing_employee_id, 10),
        appointment_date: appt.appointment_date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        remarks: appt.remarks,
      },
      updated_by: parseInt(data.updated_by, 10),
      updated_at: data.updated_at,
    };

    const result = await useAppointmentStore.getState().updateAppointment(payload);
    if (result.success) {
      setSuccess(true);
      // After success, maybe navigate away or refetch list
      setTimeout(() => {
        setSuccess(false);
        navigate('/appointments'); // adjust route
      }, 1500);
    } else {
      setLocalError(result.error || 'Failed to update appointment');
    }
  };

  if (isFetching) {
    return (
      <div className="p-4">
        <p>Loading appointment...</p>
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
              <h1 className='text-2xl font-bold'>Edit Appointment</h1>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Member select */}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
                    <div className='space-y-3'>
                      <MemberSelect
                        name="member_id"
                        label="Member *"
                        value={formData.member_id}
                        onValueChange={(value) => handleInputChange('member_id', value)}
                        placeholder="Select a member"
                      />
                    </div>
                    {/* Create Date & Time */}
                    <div className="space-y-3">
                      <Label htmlFor="created_at">Creation Date & Time *</Label>
                      <Input
                        id="created_at"
                        type="datetime-local"
                        value={formData.created_at}
                        onChange={(e) => handleInputChange('created_at', e.target.value)}
                        className="h-12"
                        disabled
                      />
                    </div>
                    {/* Created By */}
                    <div className="space-y-3">
                      <EmployeeSelect
                        name="created_by"
                        label="Created By *"
                        value={formData.created_by}
                        onValueChange={(value) => handleInputChange('created_by', value)}
                        disabled
                      />
                    </div>
                    {/* Update Date & Time */}
                    <div className="space-y-3">
                      <Label htmlFor="updated_at">Update Date & Time *</Label>
                      <Input
                        id="updated_at"
                        type="datetime-local"
                        value={formData.updated_at}
                        onChange={(e) => handleInputChange('updated_at', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    {/* Updated By */}
                    <div className="space-y-3">
                      <EmployeeSelect
                        name="updated_by"
                        label="Updated By *"
                        value={formData.updated_by}
                        onValueChange={(value) => handleInputChange('updated_by', value)}
                      />
                    </div>
                  </div>

                  {/* Single appointment card */}
                  <Card className='relative mb-6'>
                    <CardHeader className='flex items-center justify-between pb-4'>
                      <CardTitle className='text-lg'>Appointment Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className="space-y-2">
                        <EmployeeSelect
                          name="appointment.servicing_employee_id"
                          label="Servicing Employee *"
                          customOptions={[{ id: 'anyAvailableStaff', employee_name: "Any Available Staff" }]}
                          value={formData.appointment?.servicing_employee_id}
                          onValueChange={(value) => handleEmployeeChange('servicing_employee_id', value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Appointment Date *</Label>
                          <Input
                            type="date"
                            value={formData.appointment?.appointment_date || ''}
                            onChange={(e) => handleAppointmentChange('appointment_date', e.target.value)}
                            className="h-12"
                          />
                          {appointmentWarnings[0] && (
                            <p className="text-red-500 text-xs mt-1">
                              {appointmentWarnings[0]}
                            </p>
                          )}
                        </div>
                        <AppointmentDateTimeSelect
                          label="Start Time *"
                          employeeId={formData.appointment?.servicing_employee_id}
                          appointmentDate={formData.appointment?.appointment_date}
                          value={formData.appointment?.start_time}
                          onChange={(value) => handleAppointmentChange('start_time', value)}
                          placeholder="Select start time"
                          isStartTime
                          otherTimeValue={formData.appointment?.end_time}
                          appointmentIndex={0}
                          excludeAppointmentId={formData.appointment?.id}
                        />
                        <AppointmentDateTimeSelect
                          label="End Time *"
                          employeeId={formData.appointment?.servicing_employee_id}
                          appointmentDate={formData.appointment?.appointment_date}
                          value={formData.appointment?.end_time}
                          onChange={(value) => handleAppointmentChange('end_time', value)}
                          placeholder="Select end time"
                          isStartTime={false}
                          otherTimeValue={formData.appointment?.start_time}
                          appointmentIndex={0}
                          excludeAppointmentId={formData.appointment?.id}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>
                          Remarks *<span className="text-sm text-gray-500">(include service name & duration)</span>
                        </Label>
                        <Textarea
                          placeholder='e.g., REFRESHING CICA (2 Hours)'
                          value={formData.appointment?.remarks || ''}
                          onChange={(e) => handleAppointmentChange('remarks', e.target.value)}
                          className='min-h-[100px] resize-none'
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {(localError || storeError) && (
                    <Alert className='border-red-200 bg-red-50 mb-4'>
                      <AlertDescription className='text-red-800 whitespace-pre-line'>
                        {localError || storeErrorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className='border-green-200 bg-green-50 mb-4'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <AlertDescription className='text-green-800'>
                        Appointment updated successfully!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className='h-12 px-8 bg-black hover:bg-gray-800 text-white'
                  >
                    {isUpdating ? 'Updating...' : 'Update'}
                  </Button>
                </form>
              </FormProvider>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default EditAppointmentPage;
