import React, { useEffect } from 'react';
import useTimetableStore from '../../stores/useTimetableStore';
import TimetableFilters from '../../components/employee-timetable/TimetableFilters';
import MonthNavigator from '../../components/employee-timetable/MonthNavigator';
import TimetableCalendar from '../../components/employee-timetable/TimetableCalendar';

export default function EmployeeTimetablePage() {
  const initialize = useTimetableStore((state) => state.initialize);
  const loading = useTimetableStore((state) => state.loading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check Employee Timetable</h1>
        <p className="text-gray-600 mt-1">View and manage employee schedules and rest days</p>
      </div>

      {/* Top Controls */}
      <div className="mb-6">
        <TimetableFilters />
      </div>

      {/* Month Navigation */}
      <div className="mb-4">
        <MonthNavigator />
      </div>

      {/* Main Calendar */}
      <div className="bg-white rounded-lg shadow">
        {loading.timetable ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading timetable data...</div>
          </div>
        ) : (
          <TimetableCalendar />
        )}
      </div>

      {/* Current Date Display */}
      <div className="mt-4 text-center">
        <div className="inline-block bg-gray-100 px-4 py-2 rounded border">
          <span className="text-sm font-medium">Current Date: </span>
          <span className="text-sm">{new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}</span>
        </div>
      </div>
    </div>
  );
}