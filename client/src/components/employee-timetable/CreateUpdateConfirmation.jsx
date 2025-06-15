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

  // Message about existing timetable being updated
  let previousTimetableMessage = '';
  if (updatedPreviousTimetable) {
    previousTimetableMessage = `The timetable with rest day ${
      dayNames[updatedPreviousTimetable.restday_number - 1]
    } and effective start date from ${
      updatedPreviousTimetable.effective_startdate.split('T')[0]
    } has been updated to end on ${updatedPreviousTimetable.effective_enddate.split('T')[0]}.`;
  }

  // Message if the new timetable OR current updated timetable is updated with an end date
  let newTimetableMessage = '';
  if (updatedNewTimetableEffectiveEndDate) {
    newTimetableMessage =
      mode === 'update'
        ? `The current updated timetable with rest day ${dayNames[restday_number - 1]} and effective start date from ${
            effective_startdate?.split('T')[0] || '—'
          } has been set to end on ${updatedNewTimetableEffectiveEndDate.split('T')[0]}.`
        : `The new timetable with rest day ${dayNames[restday_number - 1]} and effective start date from ${
            effective_startdate?.split('T')[0] || '—'
          } has been set to end on ${updatedNewTimetableEffectiveEndDate.split('T')[0]}.`;
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold'>Timetable Successfully {mode === 'update' ? 'Updated' : 'Created'}</h2>
        <p className='text-sm text-muted-foreground'>
          The {mode === 'update' ? 'updated' : 'new'} timetable has been saved to the system.
        </p>
      </div>

      <div className='space-y-2 text-sm'>
        <table className='min-w-full table-auto'>
          <thead>
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
      {previousTimetableMessage && (
        <div className='bg-gray-100 border border-gray-300 p-4 rounded'>
          <p className='font-semibold'>Updated Existing Timetable:</p>
          <p>{previousTimetableMessage}</p>
        </div>
      )}

      {/* Message if the new timetable/updated timetable is updated with an end date */}
      {newTimetableMessage && (
        <div className='bg-gray-100 border border-gray-300 p-4 rounded'>
          <p className='font-semibold'>
            {mode === 'update' ? 'Current Updated Timetable:' : 'New Timetable End Date:'}
          </p>
          <p>{newTimetableMessage}</p>
        </div>
      )}

      {/* Appointment conflict warning section */}
      {hasConflicts && (
        <div className='bg-gray-100 border border-gray-300 p-4 rounded'>
          <p className='font-semibold mb-2'>Warning: Appointment Conflicts Detected</p>
          <ul className='list-disc pl-6'>
            {conflictDetails.map(({ rest_day_date, conflicted_count }, index) => {
              return (
                <li key={index}>
                  {conflicted_count} appointment{conflicted_count > 1 ? 's' : ''} scheduled on {rest_day_date} (
                  {dayNames[restday_number - 1]})
                </li>
              );
            })}
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
