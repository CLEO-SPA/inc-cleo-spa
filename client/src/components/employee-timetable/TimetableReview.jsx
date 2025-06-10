import React from 'react';
import { Button } from '@/components/ui/button';

const TimetableReview = ({
  employeeName,
  restDay,
  startDate,
  endDate,
  createdBy,
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

      <div className='space-y-2 text-sm'>
        <p>
          <strong>Employee:</strong> {employeeName}
        </p>
        <p>
          <strong>Rest Day:</strong> {restDay}
        </p>
        <p>
          <strong>Effective Start Date:</strong> {startDate?.toLocaleDateString()}
        </p>
        <p>
          <strong>Effective End Date:</strong> {endDate ? endDate.toLocaleDateString() : '—'}{' '}
          {!endDate && <span className='text-muted-foreground text-xs'>(timetable remains active indefinitely)</span>}
        </p>
        <p>
          <strong>Created By:</strong> {createdBy}
        </p>
        <p>
          <strong>Created At:</strong> {createdAt?.toLocaleString()}
        </p>
      </div>

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
