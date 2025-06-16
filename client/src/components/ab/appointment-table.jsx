import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import api from '@/services/api';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from "@/components/ui/forms/MemberSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const formatDisplayTime = (hour, minute) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour < 21; hour++) { // 10:00 to 20:30
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({ hour, minute });
    }
  }
  // Add final slot for 21:00
  slots.push({ hour: 21, minute: 0 });
  return slots;
};

const parseTime = (timeString) => {
  const date = new Date(timeString);
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
};

const transformAppointment = (apiAppointment) => ({
  id: parseInt(apiAppointment.id),
  customer: apiAppointment.member_name,
  customerId: parseInt(apiAppointment.member_id),
  staff: parseInt(apiAppointment.servicing_employee_id),
  staffName: apiAppointment.servicing_employee_name,
  service: apiAppointment.remarks,
  startTime: parseTime(apiAppointment.start_time),
  endTime: parseTime(apiAppointment.end_time),
  date: new Date(apiAppointment.appointment_date),
  createdAt: apiAppointment.created_at,
  updatedAt: apiAppointment.updated_at
});

export function AppointmentTable() {
  const location = useLocation();
  const navigate = useNavigate();

  // initialize date from query param or today
  const getDateFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const d = new Date(dateParam);
      if (!isNaN(d)) return d;
    }
    return new Date();
  };

  // Read employee_id from query param
  const getEmployeeFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const empParam = params.get('employee_id');
    if (empParam && /^\d+$/.test(empParam)) {
      return parseInt(empParam, 10);
    }
    return null;
  };

  const [date, setDate] = useState(getDateFromQuery());
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeePage, setEmployeePage] = useState(0);

  const EMPLOYEES_PER_PAGE = 4;

  const methods = useForm({
    defaultValues: {
      employee_id: getEmployeeFromQuery(), 
      member_id: null
    }
  });
  const { watch, reset, setValue } = methods;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empParam = params.get('employee_id');
    const empVal = empParam && /^\d+$/.test(empParam) ? empParam : '';
    setValue('employee_id', empVal);
    // No dependencies on setValue: want to run whenever location.search changes
  }, [location.search, setValue]); 

  const filterEmployeeId = Number(watch('employee_id')) || null;
  const filterMemberId = watch('member_id');

  const timeSlots = generateTimeSlots();

  const fetchStaff = async () => {
    try {
      const response = await api.get('/employee/dropdown');
      const data = await response.data;
      const transformed = data.map((emp) => ({
        id: parseInt(emp.id),
        name: emp.employee_name,
      }));
      setStaff(transformed);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAppointments = async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await api.get(`ab/date/${dateString}`);
      const data = await response.data;
      const transformed = data.data ? data.data.map(transformAppointment) : [];
      setAppointments(transformed);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAppointments(date);
  }, []);

  // Whenever `date` or `filterEmployeeId` changes: update URL query param and fetch appointments
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateString = date.toISOString().split('T')[0];
    params.set('date', dateString);
    // NEW: set or delete employee_id param
    if (filterEmployeeId) {
      params.set('employee_id', filterEmployeeId.toString());
    } else {
      params.delete('employee_id');
    }
    // push updated search
    navigate({ search: params.toString() }, { replace: true });

    fetchAppointments(date);
    setEmployeePage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, filterEmployeeId]);

  const filteredAppointments = appointments.filter(app => {
    const matchEmployee = filterEmployeeId ? app.staff === filterEmployeeId : true;
    const matchMember = filterMemberId ? app.customerId === filterMemberId : true;
    return matchEmployee && matchMember;
  });

  const staffWithAppointments = staff.filter((emp) =>
    filteredAppointments.some((app) => app.staff === emp.id)
  );
  const staffWithoutAppointments = staff.filter(
    (emp) => !staffWithAppointments.includes(emp)
  );
  const sortedStaff = [...staffWithAppointments, ...staffWithoutAppointments];

  const totalPages = Math.ceil(sortedStaff.length / EMPLOYEES_PER_PAGE);
  const paginatedStaff = filterEmployeeId
    ? staff.filter(emp => emp.id === filterEmployeeId)
    : sortedStaff.slice(
      employeePage * EMPLOYEES_PER_PAGE,
      (employeePage + 1) * EMPLOYEES_PER_PAGE
    );

  useEffect(() => {
    setEmployeePage(0);
  }, [filterEmployeeId]);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  const hasFilters = !!filterEmployeeId || !!filterMemberId;

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between bg-background py-2 border-b">
          <h2 className="text-base font-medium">{formattedDate}</h2>
          <div className="flex items-center gap-2">
            <EmployeeSelect label="" name="employee_id" />
            <MemberSelect label="" name="member_id" />
            {hasFilters && (
              <Button size="sm" variant="outline" onClick={() => reset()}>Clear Filters</Button>
            )}
            <input
              type="date"
              className="h-8 px-2 text-xs border rounded"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
            <Button size="icon" variant="outline" onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDate(new Date())}>Today</Button>
            <Button size="icon" variant="outline" onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading appointments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-md mt-4">
            <div className="flex justify-between items-center px-4 py-2 bg-muted border-b">
              <span className="text-sm text-muted-foreground">
                Total appointments: {filteredAppointments.length} |
                Showing employees {employeePage * EMPLOYEES_PER_PAGE + 1}–
                {Math.min((employeePage + 1) * EMPLOYEES_PER_PAGE, sortedStaff.length)} of {sortedStaff.length}
              </span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={employeePage === 0}
                  onClick={() => setEmployeePage((prev) => Math.max(prev - 1, 0))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={employeePage >= totalPages - 1}
                  onClick={() => setEmployeePage((prev) => Math.min(prev + 1, totalPages - 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="border px-2 py-2 w-[100px] text-left">Time</th>
                  {paginatedStaff.map((emp) => (
                    <th key={emp.id} className="border px-2 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <span>{emp.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(({ hour, minute }) => {
                  const timeInMinutes = hour * 60 + minute;
                  const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  return (
                    <tr key={timeLabel}>
                      <td className="border px-2 py-1 font-medium text-xs text-muted-foreground w-[100px]">
                        {formatDisplayTime(hour, minute)}
                      </td>
                      {paginatedStaff.map((emp) => {
                        const matchingAppointment = filteredAppointments.find((app) => {
                          const appStart = app.startTime.hour * 60 + app.startTime.minute;
                          return app.staff === emp.id && appStart === timeInMinutes;
                        });

                        const isCoveredBySpan = filteredAppointments.some((app) => {
                          const appStart = app.startTime.hour * 60 + app.startTime.minute;
                          const appEnd = app.endTime.hour * 60 + app.endTime.minute;
                          return (
                            app.staff === emp.id &&
                            appStart < timeInMinutes &&
                            timeInMinutes < appEnd
                          );
                        });

                        if (matchingAppointment) {
                          const start = matchingAppointment.startTime;
                          const end = matchingAppointment.endTime;
                          const duration = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute);
                          const rowSpan = duration / 30;

                          return (
                            <td
                              key={emp.id + timeLabel}
                              rowSpan={rowSpan}
                              className="border px-2 py-1 align-top bg-muted"
                            >
                              <div className="text-xs font-medium text-black">
                                {matchingAppointment.customer}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {matchingAppointment.service}
                              </div>
                              <div className="text-[10px] text-muted-foreground mb-1">
                                {formatDisplayTime(start.hour, start.minute)} - {formatDisplayTime(end.hour, end.minute)}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="text-sm">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/appointments/${matchingAppointment.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/appointments/edit/${matchingAppointment.id}`}>Reschedule</Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          );
                        } else if (isCoveredBySpan) {
                          return null;
                        } else {
                          return <td key={emp.id + timeLabel} className="border px-2 py-1" />;
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
