import React, { useEffect } from 'react';
import useTimetableStore from '@/stores/useTimetableStore';
import { format } from 'date-fns-tz';
import { getCurrentSimulationDate } from './CurrentDateDisplay'; 

const getRestDayName = (num) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][num - 1];

const formatToSingaporeDate = (dateString) => {
  return format(new Date(dateString), 'yyyy-MM-dd', { timeZone: 'Asia/Singapore' });
};

const TimetableDisplay = ({ employeeId }) => {
  const { timetables, isLoading, error, fetchCurrentAndUpcomingTimetablesByEmployeeId } = useTimetableStore();

  const currentDate = format(getCurrentSimulationDate(), 'yyyy-MM-dd');

  useEffect(() => {
    if (employeeId) {
      fetchCurrentAndUpcomingTimetablesByEmployeeId(employeeId, currentDate);
    }
  }, [employeeId, currentDate, fetchCurrentAndUpcomingTimetablesByEmployeeId]);

  if (!employeeId) {
    return (
      <div className='border rounded-md text-center p-6 text-sm text-muted-foreground min-h-[100px] flex items-center justify-center'>
        Display Selected Employee’s Current and Upcoming Timetables
      </div>
    );
  }

  if (isLoading) {
    return <p className='text-sm text-gray-500'>Loading timetables...</p>;
  }

  if (error) {
    return <p className='text-sm text-red-500'>Error: {error}</p>;
  }

  const { current_timetables, upcoming_timetables } = timetables;

  const renderTable = (data, title, status) => (
    <div className='space-y-2'>
      <h3 className='text-base font-semibold'>{title}</h3>
      <table className='w-full table-fixed border text-sm'>
        <thead>
          <tr className='bg-gray-100'>
            <th className='border px-4 py-2'>Rest Day</th>
            <th className='border px-4 py-2'>Effective Start Date</th>
            <th className='border px-4 py-2'>Effective End Date</th>
            <th className='border px-4 py-2'>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((t, index) => (
            <tr key={t.timetable_id || index} className='text-center'>
              <td className='border px-4 py-2'>{getRestDayName(t.restday_number)}</td>
              <td className='border px-4 py-2'>{formatToSingaporeDate(t.effective_startdate)}</td>
              <td className='border px-4 py-2'>
                {t.effective_enddate ? formatToSingaporeDate(t.effective_enddate) : '--'}
              </td>
              <td className='border px-4 py-2 font-semibold'>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (current_timetables.length === 0 && upcoming_timetables.length === 0) {
    return (
      <div className='border rounded-md text-center p-6 text-sm text-gray-500'>
        No timetable found for this employee.
      </div>
    );
  }

  return (
    <div className='border rounded-md p-4 space-y-6 bg-white text-black'>
      {current_timetables.length > 0 && renderTable(current_timetables, 'Current Timetable', 'Current')}
      {upcoming_timetables.length > 0 && renderTable(upcoming_timetables, 'Upcoming Timetable', 'Upcoming')}
    </div>
  );
};

export default TimetableDisplay;
