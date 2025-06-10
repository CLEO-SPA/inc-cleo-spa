import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, Plus, Trash2 } from 'lucide-react';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from '@/components/ui/forms/MemberSelect';
import AppointmentDateTimeSelect from '@/components/ui/forms/AppointmentDateTimeSelect';
import useAppointmentDateTimeStore from '@/stores/useAppointmentDateTimeStore';

export default function CreateAppointmentPage() {
  const methods = useForm({
    defaultValues: {
      member_id: '',
      appointments: [
        {
          id: 1,
          servicing_employee_id: '',
          appointment_date: '',
          start_time: '',
          end_time: '',
          remarks: '',
          created_by: ''
        }
      ]
    }
  });

  const { handleSubmit, watch, setValue, reset } = methods;
  const formData = watch();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get store functions and data
  const {
    appointmentWarnings,
    reset: resetStore,
    clearWarningForAppointment,
    shiftAppointmentWarnings,
    clearTimeslots,
    shouldBlockAppointmentCreation,
    getRestDayConflictMessage,
  } = useAppointmentDateTimeStore();

  const handleInputChange = (field, value) => {
    setValue(field, value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleAppointmentChange = (appointmentIndex, field, value) => {
    // set the changed field
    setValue(`appointments.${appointmentIndex}.${field}`, value)

    // Clear warning for this specific appointment when date changes
    if (field === 'appointment_date') {
      clearWarningForAppointment(appointmentIndex);
    }


    if (error) setError('')
    if (success) setSuccess(false)
  }

  // Updated function
  const handleEmployeeChange = (appointmentIndex, field, value) => {
    // Get current appointment data
    const currentAppointment = formData.appointments[appointmentIndex];

    // Set the employee field
    setValue(`appointments.${appointmentIndex}.${field}`, value);

    // Reset start and end times when employee changes
    if (field === 'servicing_employee_id') {
      setValue(`appointments.${appointmentIndex}.start_time`, '');
      setValue(`appointments.${appointmentIndex}.end_time`, '');

      // Clear warning for this specific appointment when employee changes
      clearWarningForAppointment(appointmentIndex);

      // Clear only timeslots, preserve warnings for other appointments
      clearTimeslots(appointmentIndex);
    }

    if (error) setError('');
    if (success) setSuccess(false);
  };


  const addAppointment = () => {
    const currentAppointments = formData.appointments;
    const newId = Math.max(...currentAppointments.map(apt => apt.id), 0) + 1;
    const newAppointments = [...currentAppointments, {
      id: newId,
      servicing_employee_id: '',
      appointment_date: '',
      start_time: '',
      end_time: '',
      remarks: '',
      created_by: ''
    }];
    setValue('appointments', newAppointments);
  };

  const removeAppointment = (appointmentIndex) => {
    const currentAppointments = formData.appointments || [];
    if (currentAppointments.length > 1) {
      const newAppointments = currentAppointments.filter((_, index) => index !== appointmentIndex);
      setValue('appointments', newAppointments);
    }

    // Shift appointment warnings when an appointment is removed
    shiftAppointmentWarnings(appointmentIndex);
  };

  const validateForm = (data) => {
    if (!data.member_id) return 'Please select a member';
    if (!data.created_at) return 'Please select creation date and time';
    if (!data.created_by) return 'Please select a creator';

    // Check for rest day conflict - only block if single appointment
    const appointmentCount = data.appointments.length;
    const restDayConflictMessage = getRestDayConflictMessage(appointmentCount);
    if (restDayConflictMessage) {
      return restDayConflictMessage;
    }
    
    for (let i = 0; i < data.appointments.length; i++) {
      const apt = data.appointments[i];
      const aptNum = i + 1;
      if (!apt.servicing_employee_id) return `Please select a servicing employee for Appointment ${aptNum}`;
      if (!apt.appointment_date) return `Please select a date for Appointment ${aptNum}`;
      // matches null or undefined for start_time and end_time
      if (apt.start_time == null || apt.start_time.trim() === '')
        return `Please select a start time for Appointment ${aptNum}`
      if (apt.end_time == null || apt.end_time.trim() === '')
        return `Please select an end time for Appointment ${aptNum}`
      if (apt.start_time >= apt.end_time) return `End time must be after start time for Appointment ${aptNum}`;
      if (!apt.remarks) return `Please enter your remarks for Appointment ${aptNum}`;
    }
    return null;
  };

  const onSubmit = async (data) => {
    const validationError = validateForm(data);

    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const appointmentPromises = data.appointments.map(appointment => {
        return fetch('/api/ab/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: parseInt(data.member_id),
            servicing_employee_id: parseInt(appointment.servicing_employee_id),
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            remarks: appointment.remarks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      });

      const responses = await Promise.all(appointmentPromises);
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) throw new Error(`Failed to create ${failedResponses.length} appointment(s)`);

      setSuccess(true);
      setTimeout(() => {
        reset({
          member_id: '',
          appointments: [{
            id: 1,
            servicing_employee_id: '',
            appointment_date: '',
            start_time: '',
            end_time: '',
            remarks: '',
            created_by: ''
          }]
        });
        setSuccess(false);
        resetStore(); // This will clear all warnings
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while creating appointments');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <h1 className='text-2xl font-bold'>Create an appointment</h1>

              {success && (
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>
                    Appointments created successfully!
                  </AlertDescription>
                </Alert>
              )}

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

                    {/* Creation Date & Time */}
                    <div className="space-y-3">
                      <Label htmlFor="created_at">
                        Creation Date & Time *
                      </Label>
                      <Input
                        id="created_at"
                        type="datetime-local"
                        value={formData.created_at}
                        onChange={(e) => handleInputChange('created_at', e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Created By */}
                    <div className="space-y-3">
                      <EmployeeSelect name="created_by" label="Created By *" />
                    </div>
                  </div>

                  {(formData.appointments || []).map((appointment, index) => (
                    <Card key={appointment.id || index} className='relative mb-6'>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                        <CardTitle className='text-lg'>Appointment {index + 1}</CardTitle>
                        {(formData.appointments || []).length > 1 &&
                          <Button
                            type="button"
                            variant='ghost'
                            size='sm'
                            onClick={() => removeAppointment(index)}
                            className='text-red-500 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        }
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        {/* First row: Employee Selection */}
                        <div className="space-y-2">
                          <EmployeeSelect
                            name={`appointments.${index}.servicing_employee_id`}
                            label="Servicing Employee *"
                            customOptions={[
                              { id: 'anyAvailableStaff', employee_name: "Any Available Staff" }
                            ]}
                            onValueChange={(value) => handleEmployeeChange(index, 'servicing_employee_id', value)}
                          />
                        </div>

                        {/* Second row: Date and Time Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 1. Date picker */}
                          <div className="space-y-2">
                            <Label>Appointment Date *</Label>
                            <Input
                              type="date"
                              min={today}
                              value={appointment.appointment_date || ''}
                              onChange={(e) =>
                                handleAppointmentChange(index, 'appointment_date', e.target.value)
                              }
                              className="h-12"
                            />
                            {/* Display warning message only for this specific appointment */}
                            {appointmentWarnings[index] && (
                              <p className="text-red-500 text-xs mt-1">
                                {appointmentWarnings[index]}
                              </p>
                            )}
                          </div>

                          {/* 2. Start time select with cross-validation */}
                          <AppointmentDateTimeSelect
                            label="Start Time *"
                            employeeId={appointment.servicing_employee_id}
                            appointmentDate={appointment.appointment_date}
                            value={appointment.start_time}
                            onChange={(value) => handleAppointmentChange(index, 'start_time', value)}
                            placeholder="Select start time"
                            isStartTime={true}
                            otherTimeValue={appointment.end_time} // Pass end time for filtering
                            appointmentIndex={index} // Pass unique index for each appointment
                          />

                          {/* 3. End time select with cross-validation */}
                          <AppointmentDateTimeSelect
                            label="End Time *"
                            employeeId={appointment.servicing_employee_id}
                            appointmentDate={appointment.appointment_date}
                            value={appointment.end_time}
                            onChange={(value) => handleAppointmentChange(index, 'end_time', value)}
                            placeholder="Select end time"
                            isStartTime={false}
                            otherTimeValue={appointment.start_time} // Pass start time for filtering
                            appointmentIndex={index} // Pass unique index for each appointment
                          />
                        </div>

                        {/* Third row: Remarks */}
                        <div className='space-y-2'>
                          <Label>Remarks <span className="text-sm text-gray-500">(include service name & duration)</span></Label>
                          <Textarea
                            placeholder='Type your message here. (e.g., REFRESHING CICA (2 Hours))'
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

                  {/* Red bg error message - directly above Create button */}
                  {error && (
                    <Alert className='border-red-200 bg-red-50 mb-4'>
                      <AlertDescription className='text-red-800'>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className='h-12 px-8 bg-black hover:bg-gray-800 text-white'
                  >
                    {loading ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        Creating...
                      </div>
                    ) : 'Create'}
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