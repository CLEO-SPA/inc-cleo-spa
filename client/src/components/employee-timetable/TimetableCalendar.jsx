// client/src/components/employee-timetable/TimetableCalendar.jsx
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, MoreHorizontal, Edit } from 'lucide-react';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function TimetableCalendar() {
  const {
    currentMonth,
    timetableData = [], // ✅ Default to empty array
    selectedEmployee,
    loading
  } = useEmployeeTimetableStore();
  const navigate = useNavigate();

  // --- Role-based access ---
  const { user } = useAuth();
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';

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

  // ✅ NEW: Consistent loading state
  if (loading.timetable) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading timetable data...</span>
      </div>
    );
  }

  // ✅ NEW: Error state (if needed in future)
  // if (error) {
  //   return (
  //     <Alert className="mb-4 border-red-200 bg-red-50">
  //       <AlertCircle className="h-4 w-4 text-red-600" />
  //       <AlertDescription className="text-red-800">{error}</AlertDescription>
  //     </Alert>
  //   );
  // }

  return (
    <div className="overflow-x-auto">
      {/* ✅ NEW: Standardized Table components */}
      <Table className="w-full border-collapse border border-black">
        {/* Header */}
        <TableHeader>
          <TableRow className="bg-blue-100">
            <TableHead className="border border-black px-2 py-1 text-left font-medium min-w-[100px]">
              Employee Name
            </TableHead>
            {weekdays.map((day) => (
              <TableHead key={day} className="border border-black px-1 py-1 text-center font-medium min-w-[80px]">
                {day}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {/* Body */}
        <TableBody>
          {timetableData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="border border-black px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                  <span>No timetable data available for this month</span>
                  <span className="text-xs text-gray-400">
                    {selectedEmployee 
                      ? `No schedule found for ${selectedEmployee.employee_name}` 
                      : 'Try adjusting your filters or select a different month'
                    }
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            timetableData.map((employee) => (
              <TableRow key={employee.employee_id}>
                {/* Employee Name */}
                <TableCell className="border border-black px-2 py-1 font-medium bg-gray-50">
                  {employee.employee_name}
                </TableCell>
                
                {/* Days (Monday to Sunday) */}
                {weekdays.map((day, index) => {
                  const dayNumber = index + 1; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
                  const restDay = getRestDayForDay(employee, dayNumber);
                  
                  return (
                    <TableCell 
                      key={day} 
                      className={`border border-black px-1 py-1 h-10 ${restDay ? 'bg-gray-300' : ''}`}
                    >
                      {restDay && (
                        <div className="text-xs">
                          <div className="font-medium mb-0.5">Rest Day</div>
                          <div className="text-[10px] leading-tight">
                            Start: {format(new Date(restDay.effective_startdate), 'dd MMM yyyy')}
                          </div>
                          <div className="text-[10px] leading-tight">
                            End: {restDay.effective_enddate ? format(new Date(restDay.effective_enddate), 'dd MMM yyyy') : 'Ongoing'}
                          </div>
                          
                          {/* ✅ NEW: Consistent action button pattern */}
                          {canEdit && (
                            <div className="mt-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 w-5 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="text-sm">
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/et/update-employee-timetable/${restDay.timetable_id}`)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-3 w-3" />
                                    Edit Schedule
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}