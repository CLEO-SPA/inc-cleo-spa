// src/pages/CreateAppointmentPage.jsx (or .tsx)
import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from '@/components/ui/forms/MemberSelect';
import AppointmentDateTimeSelect from '@/components/ui/forms/AppointmentDateTimeSelect';
import useAppointmentDateTimeStore from '@/stores/useAppointmentDateTimeStore';
import useAppointmentStore from '@/stores/useAppointmentStore';

const CreateAppointmentPage = () => {
  const navigate = useNavigate();
  const { createAppointment, isCreating, error: storeError, errorMessage: storeErrorMessage } = useAppointmentStore();

  const methods = useForm({
    defaultValues: {
      member_id: '',
      created_at: '',
      created_by: '',
      appointments: [
        {
          // id may not be needed for creation; remove id if backend assigns
          servicing_employee_id: '',
          appointment_date: '',
          start_time: '',
          end_time: '',
          remarks: '',
        }
      ]
    }
  });
  const { handleSubmit, watch, setValue, reset } = methods;
  const formData = watch();

  // Set default created_at to current SGT time and TODO: created_by to logged-in user
  useEffect(() => {
    const sgtNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const val = sgtNow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    setValue('created_at', val);
  }, [setValue]);

  const {
    appointmentWarnings,
    reset: resetDateTimeStore,
    clearWarningForAppointment,
    shiftAppointmentWarnings,
    clearTimeslots,
    getRestDayConflictMessage,
  } = useAppointmentDateTimeStore();

  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const validateForm = (data) => {
    if (!data.member_id) return 'Please select a member';
    if (!data.created_at) return 'Please select creation date and time';
    if (!data.created_by) return 'Please select a creator';

    const appointmentCount = data.appointments.length;
    const restMsg = getRestDayConflictMessage(appointmentCount);
    if (restMsg) return restMsg;

    for (let i = 0; i < data.appointments.length; i++) {
      const apt = data.appointments[i];
      const num = i + 1;
      if (!apt.servicing_employee_id) return `Please select a servicing employee for Appointment ${num}`;
      if (!apt.appointment_date) return `Please select a date for Appointment ${num}`;
      if (apt.start_time == null || apt.start_time.trim() === '') {
        return `Please select a start time for Appointment ${num}`;
      }
      if (apt.end_time == null || apt.end_time.trim() === '') {
        return `Please select an end time for Appointment ${num}`;
      }
      if (apt.start_time >= apt.end_time) {
        return `End time must be after start time for Appointment ${num}`;
      }
      if (!apt.remarks) return `Please enter remarks for Appointment ${num}`;
    }
    return null;
  };

  const onSubmit = async (data) => {
    const validationError = validateForm(data);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError('');
    // Build payload
    const appointmentsPayload = data.appointments.map(app => ({
      servicing_employee_id: parseInt(app.servicing_employee_id, 10),
      appointment_date: app.appointment_date,
      start_time: app.start_time,
      end_time: app.end_time,
      remarks: app.remarks,
    }));
    const payload = {
      member_id: parseInt(data.member_id, 10),
      appointments: appointmentsPayload,
      created_by: parseInt(data.created_by, 10),
      created_at: data.created_at,
    };

    // Call store action
    const result = await createAppointment(payload);
    if (result.success) {
      setSuccess(true);
      // Reset form after a short delay
      setTimeout(() => {
        setSuccess(false);
        // Extract first appointment
        const first = appointmentsPayload[0];
        navigate(
          `/appointments?date=${first.appointment_date}&employee_id=${first.servicing_employee_id}`
        );
      }, 1500);
    } else {
      // storeErrorMessage contains message
      setLocalError(result.error || 'Failed to create appointment(s)');
    }
  };

  const handleInputChange = (field, value) => {
    setValue(field, value);
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const handleAppointmentChange = (index, field, value) => {
    setValue(`appointments.${index}.${field}`, value);
    if (field === 'appointment_date') {
      // clear times and warnings
      setValue(`appointments.${index}.start_time`, '');
      setValue(`appointments.${index}.end_time`, '');
      clearWarningForAppointment(index);
      clearTimeslots(index);
    }
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const handleEmployeeChange = (index, field, value) => {
    setValue(`appointments.${index}.${field}`, value);
    if (field === 'servicing_employee_id') {
      // clear times and warnings
      setValue(`appointments.${index}.start_time`, '');
      setValue(`appointments.${index}.end_time`, '');
      clearWarningForAppointment(index);
      clearTimeslots(index);
    }
    if (localError) setLocalError('');
    if (success) setSuccess(false);
  };

  const addAppointment = () => {
    const current = formData.appointments || [];
    const newAppointments = [
      ...current,
      {
        servicing_employee_id: '',
        appointment_date: '',
        start_time: '',
        end_time: '',
        remarks: '',
      }
    ];
    setValue('appointments', newAppointments);
  };

  const removeAppointment = (index) => {
    const current = formData.appointments || [];
    if (current.length > 1) {
      const updated = current.filter((_, i) => i !== index);
      setValue('appointments', updated);
      shiftAppointmentWarnings(index);
    }
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <h1 className='text-2xl font-bold'>Create an appointment</h1>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
                    <div className='space-y-3'>
                      <MemberSelect
                        name="member_id"
                        label="Choose member *"
                        value={formData.member_id}
                        onValueChange={(value) => handleInputChange('member_id', value)}
                        placeholder="Select a member"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="created_at">Creation Date & Time *</Label>
                      <Input
                        id="created_at"
                        type="datetime-local"
                        value={formData.created_at}
                        onChange={(e) => handleInputChange('created_at', e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <EmployeeSelect
                        name="created_by"
                        label="Created By *"
                        value={formData.created_by}
                        onValueChange={(value) => handleInputChange('created_by', value)}
                      />
                    </div>
                  </div>

                  {(formData.appointments || []).map((appointment, index) => (
                    <Card key={index} className='relative mb-6'>
                      <CardHeader className='flex items-center justify-between pb-4'>
                        <CardTitle className='text-lg'>Appointment {index + 1}</CardTitle>
                        {formData.appointments.length > 1 && (
                          <Button
                            type="button"
                            variant='ghost'
                            size='sm'
                            onClick={() => removeAppointment(index)}
                            className='text-red-500 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className="space-y-2">
                          <EmployeeSelect
                            name={`appointments.${index}.servicing_employee_id`}
                            label="Servicing Employee *"
                            customOptions={[{ id: 'anyAvailableStaff', employee_name: "Any Available Staff" }]}
                            value={appointment.servicing_employee_id}
                            onValueChange={(value) => handleEmployeeChange(index, 'servicing_employee_id', value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Appointment Date *</Label>
                            <Input
                              type="date"
                              min={today}
                              value={appointment.appointment_date || ''}
                              onChange={(e) => handleAppointmentChange(index, 'appointment_date', e.target.value)}
                              className="h-12"
                            />
                            {appointmentWarnings[index] && (
                              <p className="text-red-500 text-xs mt-1">
                                {appointmentWarnings[index]}
                              </p>
                            )}
                          </div>
                          <AppointmentDateTimeSelect
                            label="Start Time *"
                            employeeId={appointment.servicing_employee_id}
                            appointmentDate={appointment.appointment_date}
                            value={appointment.start_time}
                            onChange={(value) => handleAppointmentChange(index, 'start_time', value)}
                            placeholder="Select start time"
                            isStartTime
                            otherTimeValue={appointment.end_time}
                            appointmentIndex={index}
                          />
                          <AppointmentDateTimeSelect
                            label="End Time *"
                            employeeId={appointment.servicing_employee_id}
                            appointmentDate={appointment.appointment_date}
                            value={appointment.end_time}
                            onChange={(value) => handleAppointmentChange(index, 'end_time', value)}
                            placeholder="Select end time"
                            isStartTime={false}
                            otherTimeValue={appointment.start_time}
                            appointmentIndex={index}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label>Remarks *<span className="text-sm text-gray-500">(include service name & duration)</span></Label>
                          <Textarea
                            placeholder='e.g., REFRESHING CICA (2 Hours)'
                            value={appointment.remarks || ''}
                            onChange={(e) => handleAppointmentChange(index, 'remarks', e.target.value)}
                            className='min-h-[100px] resize-none'
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant='outline'
                    onClick={addAppointment}
                    className='w-full h-12 border-dashed border-2 mb-4'
                  >
                    <Plus className='mr-2 h-4 w-4' />Add more appointment
                  </Button>

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
                        Appointment(s) created successfully!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isCreating}
                    className='h-12 px-8 bg-black hover:bg-gray-800 text-white'
                  >
                    {isCreating ? 'Creating...' : 'Create'}
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

export default CreateAppointmentPage;
