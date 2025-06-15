// client/src/components/employee-timetable/TimetableCalendar.jsx
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';

export default function TimetableCalendar() {
  const {
    currentMonth,
    timetableData = [], // ✅ Default to empty array
    selectedEmployee
  } = useEmployeeTimetableStore();

  // Get weekdays (Mon-Sun)
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper function to check if a day is a rest day for an employee
  const getRestDayForDay = (employee, dayNumber) => {
    if (!employee.rest_days || employee.rest_days.length === 0) {
      return null;
    }

    // dayNumber: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
    const restDay = employee.rest_days.find(restDay => {
      const isCorrectDay = restDay.restday_number === dayNumber;
      const startDate = new Date(restDay.effective_startdate);
      const endDate = restDay.effective_enddate ? new Date(restDay.effective_enddate) : null;
      
      // Check if the rest day is effective for the current month
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const isInDateRange = startDate <= monthEnd && (endDate ? endDate >= monthStart : true);
      
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
              Employee Name
            </th>
            {weekdays.map((day) => (
              <th key={day} className="border border-gray-300 px-2 py-2 text-center font-medium min-w-[120px]">
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
            timetableData.map((employee) => (
              <tr key={employee.employee_id}>
                {/* Employee Name */}
                <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                  {employee.employee_name}
                </td>
                
                {/* Days (Monday to Sunday) */}
                {weekdays.map((day, index) => {
                  const dayNumber = index + 1; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
                  const restDay = getRestDayForDay(employee, dayNumber);
                  
                  return (
                    <td 
                      key={day} 
                      className={`border border-gray-300 px-2 py-2 h-16 ${restDay ? 'bg-gray-300' : ''}`}
                    >
                      {restDay && (
                        <div className="text-xs">
                          <div className="font-medium mb-1">Rest Day</div>
                          <div className="text-[10px] leading-tight">
                            Start: {format(new Date(restDay.effective_startdate), 'dd MMM yyyy')}
                          </div>
                          <div className="text-[10px] leading-tight">
                            End: {restDay.effective_enddate ? format(new Date(restDay.effective_enddate), 'dd MMM yyyy') : 'Ongoing'}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
                
                {/* Actions */}
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Update
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}