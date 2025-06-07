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
import TimetableConfirmDialog from '@/components/employee-timetable/TimetableConfirmDialog';

import useTimetableStore from '@/stores/useTimetableStore';

export default function CreateEmployeeTimetablePage() {
  const methods = useForm();
  const { handleSubmit, watch } = methods;

  const selectedEmployee = watch('employee_id');
  const createdBy = watch('created_by');

  const [newRestDay, setNewRestDay] = useState('Monday');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [createdAtDate, setCreatedAtDate] = useState(null);
  const [createdAtTime, setCreatedAtTime] = useState('');
  const [createdAt, setCreatedAt] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    const now = format(getCurrentSimulationDate(), 'yyyy-MM-dd'); // Get current system time (or simulation time if needed)

    // Helper to convert "Monday" → 1, "Sunday" → 7
    const getRestDayNumber = (dayName) => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days.indexOf(dayName) + 1;
    };

    const payload = {
      employee_id: selectedEmployee,
      created_by: createdBy,
      rest_day_number: getRestDayNumber(newRestDay), // convert to number (1 = Mon)
      effective_start_date: startDate,
      effective_end_date: endDate,
      created_at: createdAt,
      current_date: now
    };

    console.log('Submitting payload:', payload);

    try {
      await createTimetable(payload);
      alert('Timetable created successfully!');
      setShowPreviewModal(false);
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
                <div>
                  <h2 className='text-2xl font-bold'>Create Employee Timetable</h2>
                  <p className='text-sm text-muted-foreground text-right'>* indicates required fields</p>
                </div>

                <FormProvider {...methods}>
                  <form className='space-y-6'>
                    {/* Row 1: Date + Employee */}
                    <div className='grid grid-cols-2 gap-8'>
                      <CurrentDateDisplay />
                      <div className='grid grid-cols-4 items-center gap-2'>
                        <Label className='col-span-1'>Employee*</Label>
                        <div className='col-span-3'>
                          <EmployeeSelect name='employee_id' label='' />
                        </div>
                      </div>
                    </div>

                    {/* Timetable Preview */}
                    <TimetableDisplay employeeId={selectedEmployee} />

                    {/* Row 2: Rest Day + Created By */}
                    <div className='grid grid-cols-2 gap-6'>
                      <RestDaySelect value={newRestDay} onChange={setNewRestDay} />
                      <div className='grid grid-cols-4 items-center gap-2'>
                        <Label className='col-span-1'>Created By*</Label>
                        <div className='col-span-3'>
                          <EmployeeSelect name='created_by' label='' />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Start Date + Created At */}
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

                    {/* Row 4: End Date */}
                    <div className='grid grid-cols-2 gap-6'>
                      <div className='col-start-1'>
                        <DateTimePicker label='Effective End Date' date={endDate} onDateChange={setEndDate} optional />
                        <p className='text-xs text-muted-foreground mt-1'>
                          (Optional – Leave blank if timetable remains in effect)
                        </p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className='flex justify-end gap-4 pt-6'>
                      <Button type='button' variant='outline'>
                        Cancel
                      </Button>
                      <Button type='button' onClick={() => setShowPreviewModal(true)} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Confirm'}
                      </Button>
                    </div>

                    {submitError && <p className='text-red-500 text-sm text-right'>{submitError}</p>}

                    <TimetableConfirmDialog
                      open={showPreviewModal}
                      onClose={() => setShowPreviewModal(false)}
                      onSubmit={handleFinalSubmit}
                      employeeName={'Jasmine Low'} // Replace with dynamic lookup if needed
                      restDay={newRestDay}
                      startDate={startDate}
                      endDate={endDate}
                      createdBy={'Amy'} // Replace with dynamic lookup if needed
                      createdAt={createdAt}
                    />
                  </form>
                </FormProvider>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
