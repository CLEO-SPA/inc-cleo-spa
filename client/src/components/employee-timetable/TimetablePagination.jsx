// client/src/components/employee-timetable/TimetablePagination.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';

export default function TimetablePagination() {
  const {
    pagination,
    loading,
    goToNextPage,
    goToPrevPage
  } = useEmployeeTimetableStore();

  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNextPage,
    hasPrevPage
  } = pagination;

  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return null; // Don't show pagination if no data
  }

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200">
      {/* Left side - Showing info */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> employees
        </span>
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevPage}
          disabled={!hasPrevPage || loading.timetable}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        {/* Page info */}
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span>
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={!hasNextPage || loading.timetable}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}