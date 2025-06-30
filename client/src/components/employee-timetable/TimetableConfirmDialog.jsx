import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TimetableConfirmDialog = ({
  open,
  onClose,
  onSubmit,
  employeeName,
  restDay,
  startDate,
  endDate,
  createdBy,
  createdAt,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Timetable</DialogTitle>
          <DialogDescription>Please confirm the details before submission.</DialogDescription>
        </DialogHeader>

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
            <strong>Created At:</strong> {createdAt?.toLocaleString() || '—'}
          </p>
        </div>

        <DialogFooter className='flex justify-end gap-4 pt-4'>
          <Button variant='outline' onClick={onClose}>
            Back
          </Button>
          <Button onClick={onSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableConfirmDialog;
