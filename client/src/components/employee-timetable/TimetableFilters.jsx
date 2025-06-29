// client/src/components/employee-timetable/TimetableFilters.jsx
import React from 'react';
import PositionFilter from './PositionFilter';
import EmployeeSearch from './EmployeeSearch';
import MonthNavigator from './MonthNavigator';

export default function TimetableFilters() {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Two Row Layout for Better Space Management */}
      <div className="space-y-3">
        {/* First Row: Month Navigation (Centered) */}
        <div className="flex justify-center">
          <MonthNavigator />
        </div>
        
        {/* Second Row: Position & Search */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <PositionFilter />
          </div>
          <div className="flex-1">
            <EmployeeSearch />
          </div>
        </div>
      </div>
    </div>
  );
}