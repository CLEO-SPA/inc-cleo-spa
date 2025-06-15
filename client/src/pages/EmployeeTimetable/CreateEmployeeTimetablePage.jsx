import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import TimetableDisplay from '@/components/employee-timetable/TimetableDisplay';
import DateTimePicker from '@/components/employee-timetable/FormDateTimePicker';
import RestDaySelect from '@/components/employee-timetable/RestDaySelect';
import CurrentDateDisplay, { getCurrentSimulationDate } from '@/components/employee-timetable/CurrentDateDisplay';
import TimetableReview from '@/components/employee-timetable/TimetableReview';
import CreateUpdateConfirmation from '@/components/employee-timetable/CreateUpdateConfirmation';

import useTimetableStore from '@/stores/useTimetableStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function CreateEmployeeTimetablePage() {
  const methods = useForm();
  const { watch, reset } = methods;

  const selectedEmployee = watch('employee_id');
  const createdBy = watch('created_by');

  const [newRestDay, setNewRestDay] = useState('Monday');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [createdAtDate, setCreatedAtDate] = useState(null);
  const [createdAtTime, setCreatedAtTime] = useState('');
  const [createdAt, setCreatedAt] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [timetableResult, setTimetableResult] = useState(null);

  const createTimetable = useTimetableStore((state) => state.createTimetable);
  const isSubmitting = useTimetableStore((state) => state.isSubmitting);
  const submitError = useTimetableStore((state) => state.submitError);

  const resetCreateTimetablePre = useTimetableStore((state) => state.resetCreateTimetablePre);

  const updateCreatedAt = (date, timeStr) => {
    if (date && timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      const dt = new Date(date);
      dt.setHours(h, m);
      setCreatedAt(dt);
    } else {
      setCreatedAt(null);
    }
  };

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
                    <div className='pt-2 text-left'>
                      <Button
                        size='sm'
                        onClick={async () => {
                          const confirmed = window.confirm(
                            'Are you sure you want to reset the create timetable pre-conditions?'
                          );
                          if (!confirmed) return;

                          try {
                            await resetCreateTimetablePre();
                            alert('Pre-conditions reset successfully.');
                          } catch (err) {
                            console.error('Reset failed:', err);
                            alert('Failed to reset. Check console for details.');
                          }
                        }}
                      >
                        Reset
                      </Button>
                    </div>

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
                      alert('Redirect to view timetable');
                    }}
                    onCreateAnother={() => {
                      setTimetableResult(null);
                      reset();
                      setNewRestDay('Monday');
                      setStartDate(null);
                      setEndDate(null);
                      setCreatedAtDate(null);
                      setCreatedAtTime('');
                      setCreatedAt(null);
                    }}
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
                        <DateTimePicker
                          label='Effective Start Date*'
                          name='start_date'
                          date={startDate}
                          onDateChange={(date) => setStartDate(date)}
                        />
                        <DateTimePicker
                          label='Created At*'
                          name='created_at'
                          date={createdAtDate}
                          time={createdAtTime}
                          onDateChange={(date) => {
                            setCreatedAtDate(date);
                            updateCreatedAt(date, createdAtTime);
                          }}
                          onTimeChange={(time) => {
                            setCreatedAtTime(time);
                            updateCreatedAt(createdAtDate, time);
                          }}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <div className='col-start-1'>
                          <DateTimePicker
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
                        <Button type='button' variant='outline'>
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
