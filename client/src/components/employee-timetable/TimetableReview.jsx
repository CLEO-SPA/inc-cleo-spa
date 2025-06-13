import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const TimetableReview = ({
  mode = 'create',
  employeeName,
  restDay,
  startDate,
  endDate,
  createdByName,
  createdAt,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}) => {
  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm text-muted-foreground'>Please confirm the details before submission.</p>
      </div>

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
            <td className='px-4 py-2'>{restDay}</td>
          </tr>
          <tr>
            <td className='px-4 py-2'>
              <strong>Effective Start Date</strong>
            </td>
            <td className='px-4 py-2'>{startDate ? format(startDate, 'yyyy-MM-dd') : '—'}</td>
          </tr>
          <tr>
            <td className='px-4 py-2'>
              <strong>Effective End Date</strong>
            </td>
            <td className='px-4 py-2'>
              {endDate ? format(endDate, 'yyyy-MM-dd') : '—'}
              {!endDate && <span className='text-muted-foreground'> (timetable remains active indefinitely)</span>}
            </td>
          </tr>
          <tr>
            <td className='px-4 py-2'>
              <strong>{mode === 'update' ? 'Updated By' : 'Created By'}</strong>
            </td>
            <td className='px-4 py-2'>{createdByName}</td>
          </tr>
          {mode === 'create' && (
            <tr>
              <td className='px-4 py-2'>
                <strong>Created At</strong>
              </td>
              <td className='px-4 py-2'>{createdAt ? format(createdAt, 'yyyy-MM-dd HH:mm') : '—'}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className='flex justify-end gap-4 pt-4'>
        <Button variant='outline' onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
      {submitError && <p className='text-red-500 text-sm text-right'>{submitError}</p>}
    </div>
  );
};

export default TimetableReview;
