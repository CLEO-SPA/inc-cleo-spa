import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Helper function to format time
const formatTime = (hour, minute) => {
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

// Generate time slots from 10 AM to 5 PM with 15-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push({
        time: formatTime(hour, minute),
        hour,
        minute
      });
    }
  }
  return slots;
};

// Sample staff data
const staff = [
  { id: 1, name: "Sarah", role: "Massage", avatar: "/avatars/sarah.jpg", color: "bg-blue-100" },
  { id: 2, name: "Michael", role: "Facial", avatar: "/avatars/michael.jpg", color: "bg-green-100" },
  { id: 3, name: "Emma", role: "Nails", avatar: "/avatars/emma.jpg", color: "bg-purple-100" }
];

// Sample appointment data
const initialAppointments = [
  {
    id: 1,
    customer: "Alice T.",
    customerAvatar: "/avatars/alice.jpg",
    staff: 1, // Sarah
    service: "Deep Tissue Massage",
    startTime: { hour: 10, minute: 0 },
    endTime: { hour: 11, minute: 0 },
    notes: "Focus on shoulders",
    date: new Date(2025, 4, 19) // May 19, 2025
  },
  {
    id: 2,
    customer: "Robert G.",
    customerAvatar: "/avatars/robert.jpg",
    staff: 2, // Michael
    service: "Facial Treatment",
    startTime: { hour: 11, minute: 30 },
    endTime: { hour: 12, minute: 30 },
    notes: "Sensitive skin",
    date: new Date(2025, 4, 19) // May 19, 2025
  },
  {
    id: 3,
    customer: "Jennifer L.",
    customerAvatar: "/avatars/jennifer.jpg",
    staff: 3, // Emma
    service: "Manicure & Pedicure",
    startTime: { hour: 13, minute: 0 },
    endTime: { hour: 14, minute: 30 },
    notes: "Dark blue polish",
    date: new Date(2025, 4, 19) // May 19, 2025
  },
  {
    id: 4,
    customer: "David W.",
    customerAvatar: "/avatars/david.jpg",
    staff: 1, // Sarah
    service: "Hot Stone Massage",
    startTime: { hour: 14, minute: 0 },
    endTime: { hour: 15, minute: 0 },
    notes: "Lower back issues",
    date: new Date(2025, 4, 19) // May 19, 2025
  },
  {
    id: 5,
    customer: "Sophia M.",
    customerAvatar: "/avatars/sophia.jpg",
    staff: 2, // Michael
    service: "Anti-Aging Facial",
    startTime: { hour: 15, minute: 15 },
    endTime: { hour: 16, minute: 15 },
    notes: "Product recommendations",
    date: new Date(2025, 4, 19) // May 19, 2025
  },
  {
    id: 6,
    customer: "Thomas K.",
    customerAvatar: "/avatars/thomas.jpg",
    staff: 1, // Sarah
    service: "Swedish Massage",
    startTime: { hour: 13, minute: 0 },
    endTime: { hour: 14, minute: 0 },
    notes: "First visit",
    date: new Date(2025, 4, 20) // May 20, 2025
  },
  {
    id: 7,
    customer: "Lisa J.",
    customerAvatar: "/avatars/lisa.jpg",
    staff: 3, // Emma
    service: "Gel Manicure",
    startTime: { hour: 11, minute: 0 },
    endTime: { hour: 12, minute: 0 },
    notes: "Red color requested",
    date: new Date(2025, 4, 21) // May 21, 2025
  }
];

export function AppointmentTable() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState(initialAppointments);
  const [view, setView] = useState("all"); // "all" or staff ID
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const timeSlots = generateTimeSlots();
  
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
      
      // Check if date matches
      if (app.date.getDate() !== date.getDate() || 
          app.date.getMonth() !== date.getMonth() || 
          app.date.getFullYear() !== date.getFullYear()) return false;
          
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
  
  // Calendar component for date selection
  const CalendarView = ({ currentDate, onDateChange, onClose }) => {
    const [viewMonth, setViewMonth] = useState(new Date(currentDate));
    
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const monthName = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const previousMonth = () => {
      const newMonth = new Date(viewMonth);
      newMonth.setMonth(viewMonth.getMonth() - 1);
      setViewMonth(newMonth);
    };
    
    const nextMonth = () => {
      const newMonth = new Date(viewMonth);
      newMonth.setMonth(viewMonth.getMonth() + 1);
      setViewMonth(newMonth);
    };
    
    const generateCalendarDays = () => {
      const year = viewMonth.getFullYear();
      const month = viewMonth.getMonth();
      
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push({ day: null, isCurrentMonth: false });
      }
      
      // Add days of the current month
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(year, month, i);
        days.push({ 
          day: i, 
          isCurrentMonth: true,
          isToday: new Date().getDate() === i && 
                  new Date().getMonth() === month && 
                  new Date().getFullYear() === year,
          isSelected: currentDate.getDate() === i && 
                     currentDate.getMonth() === month && 
                     currentDate.getFullYear() === year,
          date: dayDate,
          hasAppointments: getAppointmentsForDate(dayDate).length > 0
        });
      }
      
      // Fill out the rest of the last week
      const remainingCells = 7 - (days.length % 7);
      if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
          days.push({ day: null, isCurrentMonth: false });
        }
      }
      
      return days;
    };
    
    const handleDateClick = (calendarDate) => {
      onDateChange(calendarDate);
      onClose();
    };
    
    const days = generateCalendarDays();
    
    return (
      <div className="w-full">
        <div className="p-2 flex items-center justify-between border-b">
          <h3 className="font-medium text-sm">{monthName}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={previousMonth}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Week days header */}
        <div className="grid grid-cols-7 text-center py-1">
          {weekDays.map((day, index) => (
            <div key={index} className="text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-full text-xs",
                day.isCurrentMonth ? "cursor-pointer" : "text-muted-foreground/30",
                day.isSelected ? "bg-primary text-primary-foreground" : "",
                day.isToday && !day.isSelected ? "border border-primary text-primary" : "",
                day.hasAppointments && !day.isSelected ? "font-bold" : "",
                !day.isCurrentMonth ? "invisible" : ""
              )}
              onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
            >
              {day.day}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full flex flex-col">
      {/* Header controls */}
      <div className="flex items-center justify-between bg-background py-2 border-b">
        <div>
          <h2 className="text-base font-medium">{formattedDate}</h2>
          {/* <p className="text-xs text-muted-foreground">Appointment Schedule</p> */}
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
              <Button variant="outline" size="icon" className="h-8 w-8">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarView 
                currentDate={date} 
                onDateChange={setDate} 
                onClose={() => setCalendarOpen(false)}
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
      
      {/* Schedule table */}
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
                  <div className="mt-0.5 text-xs">{person.name}</div>
                </div>
              </div>
            ))
          ) : (
            // Show a single column for the selected staff
            <div className="flex-1 py-1 px-1 text-center">
              {(() => {
                const person = staff.find(s => s.id === parseInt(view));
                return (
                  <div className="flex flex-col items-center justify-center">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback className="text-[10px]">{person.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="mt-0.5 text-xs">{person.name}</div>
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
                      a.startTime.minute === slot.minute &&
                      a.date.getDate() === date.getDate() &&
                      a.date.getMonth() === date.getMonth() &&
                      a.date.getFullYear() === date.getFullYear()
                    );
                    
                    if (!app) return null;
                    
                    const height = getAppointmentHeight(app);
                    
                    return (
                      <div 
                        className={cn(
                          "absolute left-0 right-0 mx-0.5 rounded-sm p-1 overflow-hidden border-l-2",
                          person.color,
                          "border border-gray-200",
                          `border-l-${person.id === 1 ? 'blue' : person.id === 2 ? 'green' : 'purple'}-500`
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
                          <div className="mt-0.5 text-[8px] text-gray-500 truncate">{app.notes}</div>
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
                  const person = staff.find(s => s.id === parseInt(view));
                  const app = appointments.find(a => 
                    a.staff === parseInt(view) && 
                    a.startTime.hour === slot.hour && 
                    a.startTime.minute === slot.minute &&
                    a.date.getDate() === date.getDate() &&
                    a.date.getMonth() === date.getMonth() &&
                    a.date.getFullYear() === date.getFullYear()
                  );
                  
                  if (!app) return null;
                  
                  const height = getAppointmentHeight(app);
                  
                  return (
                    <div 
                      className={cn(
                        "absolute left-0 right-0 mx-0.5 rounded-sm p-1 overflow-hidden border-l-2",
                        person.color,
                        "border border-gray-200",
                        `border-l-${person.id === 1 ? 'blue' : person.id === 2 ? 'green' : 'purple'}-500`
                      )}
                      style={{ 
                        height: `${height * 24}px`,
                        zIndex: 1
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-4 w-4 mr-1">
                            <AvatarImage src={app.customerAvatar} alt={app.customer} />
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
                        <div className="mt-0.5 text-[8px] text-gray-500">{app.notes}</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}