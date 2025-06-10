// client/src/components/employee-timetable/TimetableFilters.jsx
import React from 'react';
import PositionFilter from './PositionFilter';
import EmployeeSearch from './EmployeeSearch';

export default function TimetableFilters() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Position Dropdown */}
      <div className="flex-shrink-0">
        <PositionFilter />
      </div>

      {/* Employee Search */}
      <div className="flex-1 min-w-[300px]">
        <EmployeeSearch />
      </div>
    </div>
  );
}