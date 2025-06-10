import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import TimetableDisplay from '@/components/employee-timetable/TimetableDisplay';
import DateTimePicker from '@/components/employee-timetable/DateTimePicker';
import RestDaySelect from '@/components/employee-timetable/RestDaySelect';
import CurrentDateDisplay, { getCurrentSimulationDate } from '@/components/employee-timetable/CurrentDateDisplay';
import TimetableReview from '@/components/employee-timetable/TimetableReview';
import CreateConfirmation from '@/components/employee-timetable/CreateConfirmation';

import useTimetableStore from '@/stores/useTimetableStore';

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
  const [timetableResult, setTimetableResult] = useState(null); // for confirmation view

  const createTimetable = useTimetableStore((state) => state.createTimetable);
  const isSubmitting = useTimetableStore((state) => state.isSubmitting);
  const submitError = useTimetableStore((state) => state.submitError);

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
      console.log('Create result:', result);
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
                <h2 className='text-2xl font-bold'>
                  {timetableResult ? 'Confirmation' : isReviewing ? 'Review Timetable' : 'Create Employee Timetable'}
                </h2>
                {!isReviewing && !timetableResult && (
                  <p className='text-sm text-muted-foreground text-right'>* indicates required fields</p>
                )}

                {timetableResult && (
                  <CreateConfirmation
                    employeeName={timetableResult.timetable_details.employee_id}
                    createdByName={timetableResult.timetable_details.created_by}
                    timetableDetails={timetableResult.timetable_details}
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

                {!timetableResult && isReviewing && (
                  <TimetableReview
                    employeeName={selectedEmployee}
                    restDay={newRestDay}
                    startDate={startDate}
                    endDate={endDate}
                    createdBy={createdBy}
                    createdAt={createdAt}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    onBack={() => setIsReviewing(false)}
                    onSubmit={handleFinalSubmit}
                  />
                )}

                {!timetableResult && !isReviewing && (
                  <FormProvider {...methods}>
                    <form className='space-y-6'>
                      <div className='grid grid-cols-2 gap-8'>
                        <CurrentDateDisplay />
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Employee*</Label>
                          <div className='col-span-3'>
                            <EmployeeSelect name='employee_id' label='' />
                          </div>
                        </div>
                      </div>

                      <TimetableDisplay employeeId={selectedEmployee} />

                      <div className='grid grid-cols-2 gap-6'>
                        <RestDaySelect value={newRestDay} onChange={setNewRestDay} />
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Created By*</Label>
                          <div className='col-span-3'>
                            <EmployeeSelect name='created_by' label='' />
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <DateTimePicker label='Effective Start Date*' date={startDate} onDateChange={setStartDate} />
                        <DateTimePicker
                          label='Created At*'
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
                        <Button type='button' onClick={() => setIsReviewing(true)}>
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
