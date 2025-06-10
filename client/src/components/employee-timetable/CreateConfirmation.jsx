import React from 'react';
import { Button } from '@/components/ui/button';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateConfirmation = ({
  employeeName,
  createdByName,
  timetableDetails,
  onViewTimetable,
  onCreateAnother,
}) => {
  const {
    restday_number,
    effective_startdate,
    effective_enddate,
    created_at,
  } = timetableDetails;

  console.log(effective_startdate);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Timetable Successfully Created</h2>
        <p className="text-sm text-muted-foreground">
          The new timetable has been saved to the system.
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <p><strong>Employee:</strong> {employeeName}</p>
        <p><strong>Rest Day:</strong> {dayNames[restday_number - 1]}</p>
        <p><strong>Effective Start Date:</strong> {effective_startdate?.split('T')[0] || '—'}</p>
        <p>
          <strong>Effective End Date:</strong>{' '}
          {effective_enddate?.split('T')[0] || '—'}
          {!effective_enddate && (
            <span className="text-muted-foreground text-xs">
              {' '} (timetable remains active indefinitely)
            </span>
          )}
        </p>
        <p><strong>Created By:</strong> {createdByName}</p>
        <p><strong>Created At:</strong> {new Date(created_at).toLocaleString()}</p>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={onViewTimetable}>
          View Timetable
        </Button>
        <Button onClick={onCreateAnother}>
          Create Another Timetable
        </Button>
      </div>
    </div>
  );
};

export default CreateConfirmation;
