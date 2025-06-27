/*
 * AppointmentTable Component
 * ---------------------------------------------
 * A Google-Calendar-style day view that displays 30-minute
 * appointment slots for each employee.
 *
 * Key Features:
 * 1. Time grid from 10 AM – 9 PM (configurable).
 * 2. Dynamic employee & member filters (via react-hook-form).
 * 3. URL-synced date and employee_id query params for bookmarking/shareability.
 * 4. Lazy loading of appointments & staff dropdown data via custom API helpers.
 * 5. Pagination for large staff lists, but auto-hides controls when a single
 *    employee filter is applied.
 * 6. Row-span technique to visually stretch multi-slot appointments.
 * 7. Context-menu (DropdownMenu) per appointment with “View” / “Reschedule”.
 *
 * Author: Arkar Phyo
 */

// -------------------------
// Imports
// -------------------------
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // (Avatar* currently unused but kept for future UX tweaks)
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils"; // eslint-disable-line @typescript-eslint/no-unused-vars
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

// -------------------------
// Helper Utilities
// -------------------------

/**
 * Converts 24-hour (hour, minute) into a 12-hour display string.
 * e.g. (13,0) → "1:00 PM"
 */
const formatDisplayTime = (hour, minute) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

// Configurable business-hour settings ------------------
const START_HOUR = 10;   // 10 AM
const END_HOUR   = 21;   // 9 PM – we’ll add a final 21:00 slot
const SLOT_MINUTES = 30; // 30-minute intervals

/**
 * Generates an array of {hour, minute} objects that represent every
 * 30-minute slot between START_HOUR and END_HOUR inclusive.
 */
const generateTimeSlots = (
  start = START_HOUR,
  end   = END_HOUR,
  step  = SLOT_MINUTES
) => {
  const slots = [];

  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      slots.push({ hour, minute });
    }
  }
  // Explicit final slot at end-of-day (end:00)
  slots.push({ hour: end, minute: 0 });
  return slots;
};

/**
 * Parses an ISO time string (e.g. "2025-06-27T10:30:00Z") and returns
 * {hour, minute} in local time.
 */
const parseTime = (timeString) => {
  const date = new Date(timeString);
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
};

/**
 * Normalises raw appointment JSON from the backend to a friendlier shape
 * for the table UI.
 */
const transformAppointment = (apiAppointment) => ({
  id:          parseInt(apiAppointment.id),
  customer:    apiAppointment.member_name,
  customerId:  parseInt(apiAppointment.member_id),
  staff:       parseInt(apiAppointment.servicing_employee_id),
  staffName:   apiAppointment.servicing_employee_name,
  service:     apiAppointment.remarks,
  startTime:   parseTime(apiAppointment.start_time),
  endTime:     parseTime(apiAppointment.end_time),
  date:        new Date(apiAppointment.appointment_date),
  createdAt:   apiAppointment.created_at,
  updatedAt:   apiAppointment.updated_at,
});

// =============================================================================
// Component: AppointmentTable
// =============================================================================
export function AppointmentTable() {
  // Router helpers -----------------------------------------------------------
  const location = useLocation();
  const navigate  = useNavigate();

  // ---------- Query-string helpers ----------
  /**
   * Reads ?date=yyyy-mm-dd or defaults to today.
   */
  const getDateFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const d = new Date(dateParam);
      if (!isNaN(d)) return d;
    }
    return new Date();
  };

  /**
   * Reads ?employee_id=N as Number or returns null.
   */
  const getEmployeeFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const empParam = params.get('employee_id');
    if (empParam && /^\d+$/.test(empParam)) {
      return parseInt(empParam, 10);
    }
    return null;
  };

  // ---------- React state ----------
  const [date, setDate]               = useState(getDateFromQuery());
  const [appointments, setAppointments] = useState([]); // raw + transformed
  const [staff, setStaff]             = useState([]);   // dropdown data
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [employeePage, setEmployeePage] = useState(0);  // pagination index

  const EMPLOYEES_PER_PAGE = 4; // grid shows 4 employees at a time

  // ---------- Form (filters) ----------
  const methods = useForm({
    defaultValues: {
      employee_id: getEmployeeFromQuery(),
      member_id:   null,
    },
  });
  const { watch, reset, setValue } = methods;

  // Whenever the URL changes externally (e.g. browser nav), sync the form.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empParam = params.get('employee_id');
    const empVal = empParam && /^\d+$/.test(empParam) ? empParam : '';
    setValue('employee_id', empVal);
  }, [location.search, setValue]);

  // Watched filter values (coerced to numbers where appropriate)
  const filterEmployeeId = Number(watch('employee_id')) || null;
  const filterMemberId   = watch('member_id');

  // Pre-compute all 30-min slots once per render.
  const timeSlots = generateTimeSlots();

  // -------------------------
  // Data-fetch helpers
  // -------------------------

  /**
   * Fetches staff dropdown data from /em/dropdown
   */
  const fetchStaff = async () => {
    try {
      const response = await api.get('/em/dropdown');
      const data     = await response.data;
      // Transform {id,name}
      const transformed = data.map((emp) => ({
        id:   parseInt(emp.id),
        name: emp.employee_name,
      }));
      setStaff(transformed);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Fetches appointments for a particular date → transforms → stores.
   */
  const fetchAppointments = async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response   = await api.get(`ab/date/${dateString}`);
      const data       = await response.data;
      const transformed = data.data ? data.data.map(transformAppointment) : [];
      setAppointments(transformed);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial mount – load staff + appointments
  useEffect(() => {
    fetchStaff();
    fetchAppointments(date);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever date or employee filter changes → update URL + refetch data
  useEffect(() => {
    const params     = new URLSearchParams(location.search);
    const dateString = date.toISOString().split('T')[0];
    params.set('date', dateString);

    // Sync employee_id query param
    if (filterEmployeeId) {
      params.set('employee_id', filterEmployeeId.toString());
    } else {
      params.delete('employee_id');
    }
    // Push new search params but keep history clean (replace)
    navigate({ search: params.toString() }, { replace: true });

    fetchAppointments(date);
    setEmployeePage(0); // reset staff pagination
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, filterEmployeeId]);

  // -------------------------
  // Derived data (memo-ish)
  // -------------------------

  // Apply filters
  const filteredAppointments = appointments.filter((app) => {
    const matchEmployee = filterEmployeeId ? app.staff === filterEmployeeId : true;
    const matchMember   = filterMemberId   ? app.customerId === filterMemberId : true;
    return matchEmployee && matchMember;
  });

  /**
   * Sort staff so that employees WITH appointments appear first
   * (helps UX when there are many blank columns).
   */
  const staffWithAppointments = staff.filter((emp) =>
    filteredAppointments.some((app) => app.staff === emp.id)
  );
  const staffWithoutAppointments = staff.filter(
    (emp) => !staffWithAppointments.includes(emp)
  );
  const sortedStaff = [...staffWithAppointments, ...staffWithoutAppointments];

  // Determine which staff columns to show given pagination / filter
  const totalPages = Math.ceil(sortedStaff.length / EMPLOYEES_PER_PAGE);
  const paginatedStaff = filterEmployeeId
    ? staff.filter((emp) => emp.id === filterEmployeeId)
    : sortedStaff.slice(
        employeePage * EMPLOYEES_PER_PAGE,
        (employeePage + 1) * EMPLOYEES_PER_PAGE
      );

  // Reset to first page whenever employee filter changes
  useEffect(() => {
    setEmployeePage(0);
  }, [filterEmployeeId]);

  // Handy display label: "Fri, Jun 27"
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const hasFilters = !!filterEmployeeId || !!filterMemberId;

  // Hide pager when a single employee is selected (no need for pages)
  const showPager = !filterEmployeeId && totalPages > 1;

  // -------------------------
  // Render
  // -------------------------
  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col">
        {/* ---- Toolbar: Date / Filters / Navigation ---- */}
        <div className="flex items-center justify-between bg-background py-2 border-b">
          <h2 className="text-base font-medium">{formattedDate}</h2>
          <div className="flex items-center gap-2">
            {/* Employee & Member selectors plug into RHF */}
            <EmployeeSelect label="" name="employee_id" />
            <MemberSelect   label="" name="member_id" />

            {/* Clear filters button only shows when something is active */}
            {hasFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  reset(); // clear RHF fields
                  // Clear employee_id from URL while keeping date
                  const params = new URLSearchParams(location.search);
                  params.delete('employee_id');
                  navigate({ search: params.toString() }, { replace: true });
                  setEmployeePage(0);
                }}
              >
                Clear Filters
              </Button>
            )}

            {/* Date picker & day navigation */}
            <input
              type="date"
              className="h-8 px-2 text-xs border rounded"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
            <Button size="icon" variant="outline" onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDate(new Date())}>
              Today
            </Button>
            <Button size="icon" variant="outline" onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ---- Error banner ---- */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* ---- Loading state ---- */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading appointments...</span>
          </div>
        ) : (
          /* ---- Main table ---- */
          <div className="overflow-x-auto border rounded-md mt-4">
            {/* Table header: appointment count + staff pager */}
            <div className="flex justify-between items-center px-4 py-2 bg-muted border-b">
              <span className="text-sm text-muted-foreground">
                Total appointments: {filteredAppointments.length} |{' '}
                {filterEmployeeId
                  ? `Showing employee ${filterEmployeeId} of ${staff.length}`
                  : `Showing employees ${employeePage * EMPLOYEES_PER_PAGE + 1}–${Math.min((employeePage + 1) * EMPLOYEES_PER_PAGE, sortedStaff.length)} of ${sortedStaff.length}`}
              </span>
              {showPager && (
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
              )}
            </div>

            {/* Sticky header row: time + staff names */}
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

              {/* Body: iterate through every 30-minute slot */}
              <tbody>
                {timeSlots.map(({ hour, minute }) => {
                  const timeInMinutes = hour * 60 + minute;
                  const timeLabel     = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                  return (
                    <tr key={timeLabel}>
                      {/* Time-axis column */}
                      <td className="border px-2 py-1 font-medium text-xs text-muted-foreground w-[100px]">
                        {formatDisplayTime(hour, minute)}
                      </td>

                      {/* Staff columns */}
                      {paginatedStaff.map((emp) => {
                        // Does an appointment start exactly at this slot?
                        const matchingAppointment = filteredAppointments.find((app) => {
                          const appStart = app.startTime.hour * 60 + app.startTime.minute;
                          return app.staff === emp.id && appStart === timeInMinutes;
                        });

                        // Or is this slot covered by the middle of an appointment?
                        const isCoveredBySpan = filteredAppointments.some((app) => {
                          const appStart = app.startTime.hour * 60 + app.startTime.minute;
                          const appEnd   = app.endTime.hour   * 60 + app.endTime.minute;
                          return app.staff === emp.id && appStart < timeInMinutes && timeInMinutes < appEnd;
                        });

                        // 1️⃣ Appointment starts here → render cell with rowSpan
                        if (matchingAppointment) {
                          const { startTime: start, endTime: end } = matchingAppointment;
                          const duration = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute);
                          const rowSpan  = duration / 30; // each row = 30 min

                          return (
                            <td
                              key={emp.id + timeLabel}
                              rowSpan={rowSpan}
                              className="border px-2 py-1 align-top bg-muted"
                            >
                              {/* Appointment block content */}
                              <div className="text-xs font-medium text-black">
                                {matchingAppointment.customer}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {matchingAppointment.service}
                              </div>
                              <div className="text-[10px] text-muted-foreground mb-1">
                                {formatDisplayTime(start.hour, start.minute)} – {formatDisplayTime(end.hour, end.minute)}
                              </div>

                              {/* Context menu: view / reschedule */}
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
                        }
                        // 2️⃣ The slot is within an existing appointment’s rowspan → render nothing
                        else if (isCoveredBySpan) {
                          return null;
                        }
                        // 3️⃣ Empty slot → render blank cell
                        else {
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
