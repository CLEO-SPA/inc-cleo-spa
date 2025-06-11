import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Calendar1Icon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import api from '@/services/api';
import { Calendar } from "@/components/ui/calendar"

// Helper function to format time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const hour = date.getHours();
  const minute = date.getMinutes();
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

// Generate time slots from 10 AM to 5 PM with 15-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push({
        time: `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
        hour,
        minute
      });
    }
  }
  return slots;
};

// Convert API time to hour/minute object
const parseTime = (timeString) => {
  const date = new Date(timeString);
  return {
    hour: date.getHours(),
    minute: date.getMinutes()
  };
};

// Transform API appointment data
const transformAppointment = (apiAppointment) => {
  return {
    id: parseInt(apiAppointment.id),
    customer: apiAppointment.member_name,
    customerId: parseInt(apiAppointment.member_id),
    staff: parseInt(apiAppointment.servicing_employee_id),
    staffName: apiAppointment.servicing_employee_name,
    service: apiAppointment.remarks,
    startTime: parseTime(apiAppointment.start_time),
    endTime: parseTime(apiAppointment.end_time),
    notes: apiAppointment.remarks,
    date: new Date(apiAppointment.appointment_date),
    createdAt: apiAppointment.created_at,
    updatedAt: apiAppointment.updated_at
  };
};

export function AppointmentTable() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [view, setView] = useState("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = generateTimeSlots();

  // Fetch staff data using your existing employee store
  const fetchStaff = async () => {
    try {
      const response = await api.get('/employee/dropdown');


      const data = await response.data;

      // Transform employee data to match the expected format
      const transformedStaff = data.map((employee, index) => ({
        id: parseInt(employee.id),
        name: employee.employee_name,
        avatar: `/avatars/${employee.employee_name.toLowerCase().replace(/\s+/g, '')}.jpg`,
        color: `bg-${['blue', 'green', 'purple', 'orange', 'pink', 'indigo'][index % 6]}-100`
      }));

      setStaff(transformedStaff);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch appointments for a specific date
  const fetchAppointments = async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log('Fetching appointments for date:', dateString);
      const response = await api.get(`ab/date/${dateString}`);

      console.log('Fetch appointments response:', response);
      const data = await response.data;

      // Transform the API data to match component expectations
      const transformedAppointments = data.data ? data.data.map(transformAppointment) : [];
      setAppointments(transformedAppointments);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchStaff();
    fetchAppointments(date);
  }, []);

  // Refetch appointments when date changes
  useEffect(() => {
    fetchAppointments(date);
  }, [date]);

  // Calculate the formatted date
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Change date handlers
  const previousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    setDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setDate(newDate);
  };

  const today = () => {
    setDate(new Date());
  };

  // Check if a time slot is within an appointment
  const isAppointmentStart = (hour, minute, staffId) => {
    return appointments.some(app => {
      if (view !== "all" && app.staff !== parseInt(view)) return false;
      if (staffId && app.staff !== staffId) return false;
      return app.startTime.hour === hour && app.startTime.minute === minute;
    });
  };

  // Calculate appointment height based on duration
  const getAppointmentHeight = (app) => {
    const startMinutes = app.startTime.hour * 60 + app.startTime.minute;
    const endMinutes = app.endTime.hour * 60 + app.endTime.minute;
    const durationInSlots = (endMinutes - startMinutes) / 15;
    return durationInSlots;
  };

  // Calendar view helpers
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(app =>
      app.date.getDate() === date.getDate() &&
      app.date.getMonth() === date.getMonth() &&
      app.date.getFullYear() === date.getFullYear()
    );
  };


  // Get staff member by ID
  const getStaffById = (id) => {
    return staff.find(s => s.id === id);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Header controls */}
      <div className="flex items-center justify-between bg-background py-2 border-b">
        <div>
          <h2 className="text-base font-medium">{formattedDate}</h2>
        </div>
        <div className="flex items-center space-x-1">
          <Select value={view} onValueChange={setView} className="w-auto">
            <SelectTrigger className="h-8 text-xs w-[100px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((person) => (
                <SelectItem key={person.id} value={person.id.toString()}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
              >
                <Calendar1Icon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start" side="bottom">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setDate(selectedDate);
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={previousDay}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={today}>Today</Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextDay}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading appointments...</span>
        </div>
      )}

      {/* Schedule table */}
      {!loading && (
        <div className="relative border overflow-auto max-h-[500px]">
          {/* Header */}
          <div className="flex border-b sticky top-0 bg-background z-10">
            <div className="min-w-[60px] py-1 px-2 border-r text-xs font-medium">Time</div>
            {view === "all" ? (
              // Show all staff columns when "All" is selected
              staff.map((person) => (
                <div key={person.id} className="flex-1 py-1 px-1 border-r text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback className="text-[10px]">{person.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="mt-0.5 text-xs">{person.name.split(' ')[0]}</div>
                  </div>
                </div>
              ))
            ) : (
              // Show a single column for the selected staff
              <div className="flex-1 py-1 px-1 text-center">
                {(() => {
                  const person = getStaffById(parseInt(view));
                  if (!person) return <div>Staff not found</div>;
                  return (
                    <div className="flex flex-col items-center justify-center">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="text-[10px]">{person.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="mt-0.5 text-xs">{person.name.split(' ')[0]}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Time slots */}
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex border-b last:border-b-0">
              <div className="min-w-[60px] py-1 px-2 border-r text-[10px] flex items-center">
                {slot.time}
              </div>
              {view === "all" ? (
                // Multiple staff columns
                staff.map((person) => (
                  <div
                    key={person.id}
                    className={cn(
                      "flex-1 relative border-r min-h-[24px]",
                      (slot.hour === 12 || slot.minute === 0) ? "border-t border-t-gray-200" : ""
                    )}
                  >
                    {isAppointmentStart(slot.hour, slot.minute, person.id) && (() => {
                      const app = appointments.find(a =>
                        a.staff === person.id &&
                        a.startTime.hour === slot.hour &&
                        a.startTime.minute === slot.minute
                      );
                      if (!app) return null;
                      const height = getAppointmentHeight(app);
                      return (
                        <div
                          className={cn(
                            "absolute left-0 right-0 mx-0.5 rounded-sm p-1 overflow-hidden border-l-2",
                            person.color,
                            "border border-gray-200",
                            "border-l-blue-500"
                          )}
                          style={{
                            height: `${height * 24}px`,
                            zIndex: 1
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-[10px] truncate">{app.customer}</div>
                            <Button variant="ghost" size="icon" className="h-4 w-4 -mt-1 -mr-1 opacity-50 hover:opacity-100">
                              <MoreHorizontal className="h-2 w-2" />
                            </Button>
                          </div>
                          <div className="text-[9px] truncate">{app.service}</div>
                          {height > 2 && (
                            <div className="mt-0.5 text-[8px] text-gray-500 truncate">
                              {formatTime(new Date(`2000-01-01T${app.startTime.hour.toString().padStart(2, '0')}:${app.startTime.minute.toString().padStart(2, '0')}:00`))} - {formatTime(new Date(`2000-01-01T${app.endTime.hour.toString().padStart(2, '0')}:${app.endTime.minute.toString().padStart(2, '0')}:00`))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))
              ) : (
                // Single staff column
                <div
                  className={cn(
                    "flex-1 relative min-h-[24px]",
                    (slot.hour === 12 || slot.minute === 0) ? "border-t border-t-gray-200" : ""
                  )}
                >
                  {isAppointmentStart(slot.hour, slot.minute) && (() => {
                    const person = getStaffById(parseInt(view));
                    const app = appointments.find(a =>
                      a.staff === parseInt(view) &&
                      a.startTime.hour === slot.hour &&
                      a.startTime.minute === slot.minute
                    );
                    if (!app || !person) return null;
                    const height = getAppointmentHeight(app);
                    return (
                      <div
                        className={cn(
                          "absolute left-0 right-0 mx-0.5 rounded-sm p-1 overflow-hidden border-l-2",
                          person.color,
                          "border border-gray-200",
                          "border-l-blue-500"
                        )}
                        style={{
                          height: `${height * 24}px`,
                          zIndex: 1
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Avatar className="h-4 w-4 mr-1">
                              <AvatarFallback className="text-[8px]">{app.customer.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-[10px]">{app.customer}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-4 w-4 -mt-1 -mr-1 opacity-50 hover:opacity-100">
                            <MoreHorizontal className="h-2 w-2" />
                          </Button>
                        </div>
                        <div className="text-[9px]">{app.service}</div>
                        {height > 2 && (
                          <div className="mt-0.5 text-[8px] text-gray-500">
                            {formatTime(new Date(`2000-01-01T${app.startTime.hour.toString().padStart(2, '0')}:${app.startTime.minute.toString().padStart(2, '0')}:00`))} - {formatTime(new Date(`2000-01-01T${app.endTime.hour.toString().padStart(2, '0')}:${app.endTime.minute.toString().padStart(2, '0')}:00`))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No appointments message */}
      {!loading && appointments.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No appointments scheduled for {formattedDate}
        </div>
      )}
    </div>
  );
}