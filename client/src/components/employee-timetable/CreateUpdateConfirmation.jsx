import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateUpdateConfirmation = ({
  mode = 'create',
  employeeName,
  createdByName,
  timetableDetails,
  conflictDetails = [],
  updatedPreviousTimetable,
  updatedNewTimetableEffectiveEndDate,
  onViewTimetable,
  onCreateAnother,
  onCheckAppointments,
}) => {
  const { restday_number, effective_startdate, effective_enddate, created_at, updated_at } = timetableDetails;
  const timestamp = mode === 'update' ? updated_at : created_at;

  const hasConflicts = conflictDetails.length > 0;

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold'>Timetable Successfully {mode === 'update' ? 'Updated' : 'Created'}</h2>
        <p className='text-sm text-muted-foreground'>
          The {mode === 'update' ? 'updated' : 'new'} timetable has been saved to the system.
        </p>
      </div>

      <div className='space-y-2 text-sm py-5 border-b'>
        <table className='min-w-full table-auto'>
          <thead>
            <tr>
              <td colSpan={2} className='px-4 py-3 font-semibold text-sm border-t bg-white'>
                The details of the {mode === 'update' ? 'updated' : 'newly created'} timetable:
              </td>
            </tr>
            <tr>
              <th className='px-4 py-2 text-left'>Field</th>
              <th className='px-4 py-2 text-left'>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='px-4 py-2'>
                <strong>Employee</strong>
              </td>
              <td className='px-4 py-2'>{employeeName}</td>
            </tr>
            <tr>
              <td className='px-4 py-2'>
                <strong>Rest Day</strong>
              </td>
              <td className='px-4 py-2'>{dayNames[restday_number - 1]}</td>
            </tr>
            <tr>
              <td className='px-4 py-2'>
                <strong>Effective Start Date</strong>
              </td>
              <td className='px-4 py-2'>{effective_startdate?.split('T')[0] || '—'}</td>
            </tr>
            <tr>
              <td className='px-4 py-2'>
                <strong>Effective End Date</strong>
              </td>
              <td className='px-4 py-2'>
                {effective_enddate?.split('T')[0] || '—'}
                {!effective_enddate && (
                  <span className='text-muted-foreground'> (timetable remains active indefinitely)</span>
                )}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-2'>
                <strong>{mode === 'update' ? 'Updated By' : 'Created By'}</strong>
              </td>
              <td className='px-4 py-2'>{createdByName}</td>
            </tr>
            <tr>
              <td className='px-4 py-2'>
                <strong>{mode === 'update' ? 'Updated At' : 'Created At'}</strong>
              </td>
              <td className='px-4 py-2'>{timestamp ? format(timestamp, 'yyyy-MM-dd HH:mm') : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Message about existing timetable being updated */}
      {updatedPreviousTimetable && (
        <div className='p-4 border rounded space-y-2'>
          <p className='font-semibold'>Existing Timetable Updated</p>
          <ul className='list-disc pl-6 text-sm leading-relaxed'>
            <li>Rest Day: {dayNames[updatedPreviousTimetable.restday_number - 1]}</li>
            <li>Start Date: {updatedPreviousTimetable.effective_startdate.split('T')[0]}</li>
            <li>
              <div>
                <strong>Updated End Date: {updatedPreviousTimetable.effective_enddate.split('T')[0]} </strong>
                <div className='text-sm text-muted-foreground'>
                  (The end date is updated to 1 day before the effective start date of the new timetable)
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}

      {/* Message if the new timetable/updated timetable is updated with an end date */}
      {updatedNewTimetableEffectiveEndDate && (
        <div className='p-4 border rounded space-y-2'>
          <p className='font-semibold'>
            {mode === 'update' ? 'Timetable End Date Updated' : 'New Timetable End Date Updated'}
          </p>
          <ul className='list-disc pl-6 text-sm leading-relaxed'>
            <li>Rest Day: {dayNames[restday_number - 1]}</li>
            <li>Start Date: {effective_startdate?.split('T')[0] || '—'}</li>
            <li>
              <div>
                <strong>Updated End Date: {updatedNewTimetableEffectiveEndDate.split('T')[0]}</strong>
                <div className='text-sm text-muted-foreground'>
                  (The end date is updated to 1 day before the effective start date of the existing upcoming timetable)
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}

      {/* Appointment conflict warning section */}
      {hasConflicts && (
        <div className='p-4 border rounded space-y-2'>
          <p className='font-semibold'>Appointment Conflicts Detected</p>
          <ul className='list-disc pl-6 text-sm leading-relaxed space-y-1'>
            {conflictDetails.map(({ rest_day_date, conflicted_count }, index) => (
              <li key={index}>
                <strong>
                  {conflicted_count} appointment{conflicted_count > 1 ? 's' : ''}
                </strong>{' '}
                scheduled on{' '}
                <strong>
                  {rest_day_date} ({dayNames[restday_number - 1]}
                </strong>
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex justify-end gap-4 pt-4'>
        <Button onClick={onViewTimetable} {...(mode === 'create' ? { variant: 'outline' } : {})}>
          View Timetable
        </Button>

        {mode === 'create' && (
          <>
            {hasConflicts ? (
              <Button onClick={onCheckAppointments}>Check Appointments</Button>
            ) : (
              <Button onClick={onCreateAnother}>Create Another Timetable</Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreateUpdateConfirmation;
