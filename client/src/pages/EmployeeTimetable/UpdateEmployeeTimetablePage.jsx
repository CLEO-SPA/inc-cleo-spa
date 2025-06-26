import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';

import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import FormDateTimePicker from '@/components/employee-timetable/FormDateTimePicker';
import RestDaySelect from '@/components/employee-timetable/RestDaySelect';
import CurrentDateDisplay, { getCurrentSimulationDate } from '@/components/employee-timetable/CurrentDateDisplay';
import TimetableReview from '@/components/employee-timetable/TimetableReview';
import CreateUpdateConfirmation from '@/components/employee-timetable/CreateUpdateConfirmation';

import useTimetableStore from '@/stores/useTimetableStore';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function UpdateEmployeeTimetablePage() {
  const { timetableId } = useParams();
  const methods = useForm();
  const { setValue, watch } = methods;
  const navigate = useNavigate();

  // --- Role-based access ---
  const { user } = useAuth();
  const allowedRoles = ['super_admin', 'data_admin'];
  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      navigate('*'); 
    }
  }, [user, navigate]);

  const updatedBy = watch('updated_by');
  const updatedAt = format(getCurrentSimulationDate(), 'yyyy-MM-dd');

  const fetchTimetableById = useTimetableStore((state) => state.fetchTimetableById);
  const fetchEmployeeNameById = useEmployeeStore((state) => state.fetchEmployeeNameById);

  const [restDay, setRestDay] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [updatedByName, setUpdatedByName] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [timetableResult, setTimetableResult] = useState(null);

  const updateTimetable = useTimetableStore((state) => state.updateTimetable);
  const isSubmitting = useTimetableStore((state) => state.isSubmitting);
  const submitError = useTimetableStore((state) => state.submitError);

  useEffect(() => {
    const fetchData = async () => {
      if (!timetableId) return;

      try {
        const result = await fetchTimetableById(timetableId);
        const data = result;

        if (data) {
          setValue('employee_id', data.employee_id);
          setValue('updated_by', null);
          setRestDay(
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][data.restday_number - 1]
          );
          setStartDate(new Date(data.effective_startdate));
          setEndDate(data.effective_enddate ? new Date(data.effective_enddate) : null);
          setEmployeeName(data.employee_name);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch timetable.');
      }
    };

    fetchData();
  }, [timetableId, fetchTimetableById, setValue]);

  useEffect(() => {
    if (updatedBy) {
      const fetchName = async () => {
        try {
          const res = await fetchEmployeeNameById(updatedBy);
          setUpdatedByName(res.data.employee_name);
        } catch (err) {
          console.error('Failed to fetch updated by name:', err);
        }
      };
      fetchName();
    }
  }, [updatedBy, fetchEmployeeNameById]);

  const handleFinalSubmit = async () => {
    const now = format(getCurrentSimulationDate(), 'yyyy-MM-dd');
    const updated_at = format(getCurrentSimulationDate(), "yyyy-MM-dd'T'HH:mm:ssxxx");

    const getRestDayNumber = (dayName) => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days.indexOf(dayName) + 1;
    };

    const payload = {
      timetable_id: timetableId,
      current_date: now,
      rest_day_number: getRestDayNumber(restDay),
      effective_start_date: startDate,
      effective_end_date: endDate,
      updated_by: updatedBy,
      updated_at: updated_at,
    };

    try {
      const result = await updateTimetable(payload);
      setTimetableResult(result.update_employee_timetable);
      setIsReviewing(false);
    } catch (err) {
      console.error('Error updating timetable:', err);
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
                  {timetableResult ? 'Confirmation' : isReviewing ? 'Review Timetable' : 'Update Employee Timetable'}
                </h2>
                {!isReviewing && !timetableResult && (
                  <p className='text-sm text-muted-foreground text-right'>* indicates required fields</p>
                )}

                {/* Confirmation view after successful update */}
                {timetableResult && (
                  <CreateUpdateConfirmation
                    mode='update'
                    employeeName={employeeName}
                    createdByName={updatedByName}
                    timetableDetails={timetableResult.timetable_details}
                    updatedPreviousTimetable={timetableResult.updated_previous_timetable}
                    updatedNewTimetableEffectiveEndDate={timetableResult.updated_current_timetable_enddate}
                    onViewTimetable={() => {
                      navigate('/et')
                    }}
                  />
                )}

                {/* Review page before submission */}
                {!timetableResult && isReviewing && (
                  <TimetableReview
                    mode='update'
                    employeeName={employeeName}
                    restDay={restDay}
                    startDate={startDate}
                    endDate={endDate}
                    createdByName={updatedByName}
                    createdAt={updatedAt}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    onBack={() => setIsReviewing(false)}
                    onSubmit={handleFinalSubmit}
                  />
                )}

                {/* Initial timetable update form */}
                {!timetableResult && !isReviewing && (
                  <FormProvider {...methods}>
                    <form className='space-y-6'>
                      <div className='grid grid-cols-2 gap-8'>
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Employee Name</Label>
                          <p className='col-span-3 font-medium'>{employeeName || '—'}</p>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-8'>
                        <CurrentDateDisplay />
                        <RestDaySelect value={restDay} onChange={setRestDay} label='Rest Day' />
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <FormDateTimePicker
                          label='Effective Start Date'
                          name='start_date'
                          date={startDate}
                          onDateChange={setStartDate}
                          optional
                        />
                        <FormDateTimePicker
                          label='Effective End Date'
                          name='end_date'
                          date={endDate}
                          onDateChange={setEndDate}
                          optional
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-6'>
                        <div className='grid grid-cols-4 items-center gap-2'>
                          <Label className='col-span-1'>Updated By*</Label>
                          <div className='col-span-3'>
                            <EmployeeSelect name='updated_by' label='' rules={{ required: 'Updated by is required' }} />
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-end gap-4 pt-6'>
                        <Button type='button' variant='outline' onClick={() => navigate('/et')}>
                          Cancel
                        </Button>
                        <Button type='submit' onClick={methods.handleSubmit(() => setIsReviewing(true))}>
                          Save Changes
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
