// client/src/components/employee-timetable/TimetableCalendar.jsx
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import useTimetableStore from '../../stores/useTimetableStore';

export default function TimetableCalendar() {
  const {
    currentMonth,
    timetableData = [], // ✅ Default to empty array
    selectedEmployee
  } = useTimetableStore();

  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get weekdays (Mon-Sun)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper function to check if a date is a rest day for an employee
  const isRestDay = (employee, date) => {
    if (!employee.rest_days || employee.rest_days.length === 0) {
      return false;
    }

    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO (1 = Monday, 7 = Sunday)

    return employee.rest_days.some(restDay => {
      const isCorrectDay = restDay.restday_number === isoDay;
      const startDate = new Date(restDay.effective_startdate);
      const endDate = restDay.effective_enddate ? new Date(restDay.effective_enddate) : null;
      
      const isInDateRange = date >= startDate && (endDate ? date <= endDate : true);
      
      return isCorrectDay && isInDateRange;
    });
  };

  // Helper function to get rest day info for tooltip
  const getRestDayInfo = (employee, date) => {
    if (!employee.rest_days) return null;

    const dayOfWeek = getDay(date);
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    const restDay = employee.rest_days.find(rd => {
      const isCorrectDay = rd.restday_number === isoDay;
      const startDate = new Date(rd.effective_startdate);
      const endDate = rd.effective_enddate ? new Date(rd.effective_enddate) : null;
      const isInDateRange = date >= startDate && (endDate ? date <= endDate : true);
      return isCorrectDay && isInDateRange;
    });

    return restDay;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        {/* Header */}
        <thead>
          <tr className="bg-blue-100">
            <th className="border border-gray-300 px-4 py-2 text-left font-medium min-w-[120px]">
              Name
            </th>
            {weekdays.map((day) => (
              <th key={day} className="border border-gray-300 px-2 py-2 text-center font-medium min-w-[80px]">
                {day}
              </th>
            ))}
            <th className="border border-gray-300 px-4 py-2 text-center font-medium min-w-[100px]">
              Actions
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {timetableData.length === 0 ? (
            <tr>
              <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                No timetable data available for this month
              </td>
            </tr>
          ) : (
            timetableData.map((employee) => {
              // Group days by week
              const weeks = [];
              let currentWeek = [];
              
              daysInMonth.forEach((date) => {
                const dayOfWeek = getDay(date);
                const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday=0 index
                
                if (currentWeek.length === 0) {
                  // Start new week, fill empty days if needed
                  for (let i = 0; i < mondayIndex; i++) {
                    currentWeek.push(null);
                  }
                }
                
                currentWeek.push(date);
                
                if (currentWeek.length === 7 || date === monthEnd) {
                  // Fill remaining days if needed
                  while (currentWeek.length < 7) {
                    currentWeek.push(null);
                  }
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
              });

              return weeks.map((week, weekIndex) => (
                <tr key={`${employee.employee_id}-week-${weekIndex}`}>
                  {weekIndex === 0 && (
                    <td 
                      className="border border-gray-300 px-4 py-2 font-medium bg-gray-50"
                      rowSpan={weeks.length}
                    >
                      {employee.employee_name}
                    </td>
                  )}
                  
                  {week.map((date, dayIndex) => {
                    if (!date) {
                      return (
                        <td key={`empty-${dayIndex}`} className="border border-gray-300 px-2 py-2">
                          {/* Empty cell for days outside current month */}
                        </td>
                      );
                    }

                    const isRest = isRestDay(employee, date);
                    const restInfo = getRestDayInfo(employee, date);

                    return (
                      <td key={format(date, 'yyyy-MM-dd')} className="border border-gray-300 px-2 py-2 h-16 relative">
                        <div className="text-xs text-gray-600 mb-1">
                          {format(date, 'd')}
                        </div>
                        
                        {isRest && restInfo && (
                          <div 
                            className="bg-gray-300 p-1 rounded text-xs cursor-help"
                            title={`Rest Day: ${restInfo.restday_name}\nStart: ${format(new Date(restInfo.effective_startdate), 'dd MMM yyyy')}\nEnd: ${restInfo.effective_enddate ? format(new Date(restInfo.effective_enddate), 'dd MMM yyyy') : 'Ongoing'}`}
                          >
                            <div className="font-medium">Rest</div>
                            <div className="text-[10px] leading-tight">
                              Start: {format(new Date(restInfo.effective_startdate), 'dd MMM')}
                            </div>
                            <div className="text-[10px] leading-tight">
                              End: {restInfo.effective_enddate ? format(new Date(restInfo.effective_enddate), 'dd MMM') : 'Ongoing'}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {weekIndex === 0 && (
                    <td 
                      className="border border-gray-300 px-2 py-2 text-center"
                      rowSpan={weeks.length}
                    >
                      <div className="space-y-1">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Create
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Create
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Create
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Create
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ));
            })
          )}
        </tbody>
      </table>
    </div>
  );
}