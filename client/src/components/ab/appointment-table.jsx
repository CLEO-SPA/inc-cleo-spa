import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import api from '@/services/api';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from "@/components/ui/forms/MemberSelect";

const formatDisplayTime = (hour, minute) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({ hour, minute });
    }
  }
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
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeePage, setEmployeePage] = useState(0);

  const EMPLOYEES_PER_PAGE = 4;

  const methods = useForm({ defaultValues: { employee_id: null, member_id: null } });
  const { watch, reset } = methods;

  const filterEmployeeId = watch('employee_id');
  const filterMemberId = watch('member_id');

  const timeSlots = generateTimeSlots();

  const fetchStaff = async () => {
    try {
      const response = await api.get('/employee/dropdown');
      const data = await response.data;
      const transformed = data.map((emp, i) => ({
        id: parseInt(emp.id),
        name: emp.employee_name,
        avatar: `/avatars/${emp.employee_name.toLowerCase().replace(/\s+/g, '')}.jpg`,
        color: `bg-${['blue', 'green', 'purple', 'orange', 'pink', 'indigo'][i % 6]}-100`
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

  useEffect(() => {
    fetchAppointments(date);
  }, [date]);

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
  const paginatedStaff = sortedStaff.slice(
    employeePage * EMPLOYEES_PER_PAGE,
    (employeePage + 1) * EMPLOYEES_PER_PAGE
  );

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
              <div className="text-sm text-muted-foreground">
                Showing employees {employeePage * EMPLOYEES_PER_PAGE + 1}–
                {Math.min((employeePage + 1) * EMPLOYEES_PER_PAGE, sortedStaff.length)} of {sortedStaff.length}
              </div>
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
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
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
                        // Check if an appointment starts exactly at this slot
                        const matchingAppointment = filteredAppointments.find((app) => {
                          const appStart = app.startTime.hour * 60 + app.startTime.minute;
                          return app.staff === emp.id && appStart === timeInMinutes;
                        });

                        // Check if a cell is already spanned by a previous appointment
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
                              className="border px-2 py-1 align-top bg-blue-50"
                            >
                              <div className="text-xs text-blue-900 font-medium">
                                {matchingAppointment.customer}
                              </div>
                              <div className="text-xs text-blue-800">
                                {matchingAppointment.service}
                              </div>
                              <div className="text-[10px] text-blue-700">
                                {formatDisplayTime(start.hour, start.minute)} - {formatDisplayTime(end.hour, end.minute)}
                              </div>
                            </td>
                          );
                        } else if (isCoveredBySpan) {
                          return null; // Skip rendering this cell
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