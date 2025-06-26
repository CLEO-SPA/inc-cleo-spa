import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import useAuth from '@/hooks/useAuth';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import TimetableDisplay from '@/components/employee-timetable/TimetableDisplay';
import FormDateTimePicker from '@/components/employee-timetable/FormDateTimePicker';
import RestDaySelect from '@/components/employee-timetable/RestDaySelect';
import CurrentDateDisplay, { getCurrentSimulationDate } from '@/components/employee-timetable/CurrentDateDisplay';
import TimetableReview from '@/components/employee-timetable/TimetableReview';
import CreateUpdateConfirmation from '@/components/employee-timetable/CreateUpdateConfirmation';

import useTimetableStore from '@/stores/useTimetableStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function CreateEmployeeTimetablePage() {
  const methods = useForm();
  const navigate = useNavigate();
  const { watch, reset } = methods;

  // --- Role-based access ---
  const { user } = useAuth();
  const allowedRoles = ['super_admin', 'data_admin'];
  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      navigate('*'); 
    }
  }, [user, navigate]);

  const selectedEmployee = watch('employee_id');
  const createdBy = watch('created_by');

  const [newRestDay, setNewRestDay] = useState('Monday');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [timetableResult, setTimetableResult] = useState(null);

  const createTimetable = useTimetableStore((state) => state.createTimetable);
  const isSubmitting = useTimetableStore((state) => state.isSubmitting);
  const submitError = useTimetableStore((state) => state.submitError);

  const [employeeName, setEmployeeName] = useState('');
  const [createdByName, setCreatedByName] = useState('');

  const fetchEmployeeNameById = useEmployeeStore((state) => state.fetchEmployeeNameById);

  useEffect(() => {
    if (selectedEmployee) {
      const fetchEmployeeDetails = async () => {
        try {
          const employeeData = await fetchEmployeeNameById(selectedEmployee);
          setEmployeeName(employeeData.data.employee_name);
        } catch (error) {
          console.error('Error fetching employee data:', error);
        }
      };

      fetchEmployeeDetails();
    }
  }, [selectedEmployee, fetchEmployeeNameById]);

  useEffect(() => {
    if (createdBy) {
      const fetchCreatedByDetails = async () => {
        try {
          const createdByData = await fetchEmployeeNameById(createdBy);
          setCreatedByName(createdByData.data.employee_name);
        } catch (error) {
          console.error('Error fetching createdBy data:', error);
        }
      };

      fetchCreatedByDetails();
    }
  }, [createdBy, fetchEmployeeNameById]);

  const handleFinalSubmit = async () => {
    const now = format(getCurrentSimulationDate(), 'yyyy-MM-dd');

    const getRestDayNumber = (dayName) => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days.indexOf(dayName) + 1;
    };

    const payload = {
      employee_id: selectedEmployee,
      created_by: createdBy,
      rest_day_number: getRestDayNumber(newRestDay),
      effective_start_date: startDate,
      effective_end_date: endDate,
      created_at: createdAt,
      current_date: now,
    };

    try {
      const result = await createTimetable(payload);
      setTimetableResult(result.create_employee_timetable);
      setIsReviewing(false);
    } catch (err) {
      console.error('Error creating timetable:', err);
    }
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))] bg-muted/50'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-8 bg-gray-100'>
              <div className='p-8 bg-white rounded-lg border space-y-6 w-full max-w-full'>
                {/* Page title header changes based on state */}
                <h2 className='text-2xl font-bold'>
                  {timetableResult ? 'Confirmation' : isReviewing ? 'Review Timetable' : 'Create Employee Timetable'}
                </h2>
                {!isReviewing && !timetableResult && (
                  <>
                    <p className='text-sm text-muted-foreground text-right'>* indicates required fields</p>
                  </>
                )}

                {/* Confirmation view after successful creation */}
                {timetableResult && (
                  <CreateUpdateConfirmation
                    employeeName={employeeName}
                    createdByName={createdByName}
                    timetableDetails={timetableResult.timetable_details}
                    conflictDetails={timetableResult.conflict_details}
                    updatedPreviousTimetable={timetableResult.updated_previous_timetable}
                    updatedNewTimetableEffectiveEndDate={timetableResult.updated_new_timetable_effective_enddate}
                    onViewTimetable={() => {
                      navigate('/et');
                    }}
                    onCreateAnother={() => {
                      setTimetableResult(null);
                      reset();
                      setNewRestDay('Monday');
                      setStartDate(null);
                      setEndDate(null);
                      setCreatedAt(null);
                    }}
                    onCheckAppointments={() => navigate('/appointments')}
                  />
                )}

                {/* Review page before submission */}
                {!timetableResult && isReviewing && (
                  <TimetableReview
                    mode='create'
                    employeeName={employeeName}
                    restDay={newRestDay}
                    startDate={startDate}
                    endDate={endDate}
                    createdByName={createdByName}
                    createdAt={createdAt}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    onBack={() => setIsReviewing(false)}
                    onSubmit={handleFinalSubmit}
                  />
                )}

                {/* Initial timetable creation form */}
                {!timetableResult && !isReviewing && (
                  <FormProvider {...methods}>
                    <form className='space-y-6'>
                      <div className='grid grid-cols-2 gap-8'>
                        <CurrentDateDisplay />
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Employee*</Label>
                          <div className='col-span-3'>
                            <EmployeeSelect name='employee_id' label='' rules={{ required: 'Employee is required' }} />
                          </div>
                        </div>
                      </div>

                      {/* Display current/upcoming timetable */}
                      <TimetableDisplay employeeId={selectedEmployee} />

                      <div className='grid grid-cols-2 gap-6'>
                        <RestDaySelect value={newRestDay} onChange={setNewRestDay} />
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Created By*</Label>
                          <div className='col-span-3'>
                            <EmployeeSelect name='created_by' label='' rules={{ required: 'Created By is required' }} />
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <FormDateTimePicker
                          label='Effective Start Date*'
                          name='start_date'
                          date={startDate}
                          onDateChange={(date) => setStartDate(date)}
                        />
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1' htmlFor='created_at'>
                            Created At*
                          </Label>
                          <div className='col-span-3'>
                            <Input
                              id='created_at'
                              type='datetime-local'
                              className='w-[250px]'
                              value={createdAt ? format(createdAt, "yyyy-MM-dd'T'HH:mm") : ''}
                              onChange={(e) => setCreatedAt(new Date(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <div className='col-start-1'>
                          <FormDateTimePicker
                            label='Effective End Date'
                            name='end_date'
                            date={endDate}
                            onDateChange={setEndDate}
                            optional
                          />
                          <p className='text-xs text-muted-foreground mt-1'>
                            (Optional – Leave blank if timetable remains in effect)
                          </p>
                        </div>
                      </div>

                      <div className='flex justify-end gap-4 pt-6'>
                        <Button type='button' variant='outline' onClick={() => navigate('/et')}>
                          Cancel
                        </Button>
                        <Button type='submit' onClick={methods.handleSubmit(() => setIsReviewing(true))}>
                          Confirm
                        </Button>
                      </div>

                      {submitError && <p className='text-red-500 text-sm text-right'>{submitError}</p>}
                    </form>
                  </FormProvider>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
