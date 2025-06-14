// Updated AppointmentTable.jsx using standalone EmployeeSelect + MemberSelect with useForm support + conditional clear filters
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import api from '@/services/api';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from "@/components/ui/forms/MemberSelect";

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const hour = date.getHours();
  const minute = date.getMinutes();
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
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

  const methods = useForm({ defaultValues: { employee_id: null, member_id: null } });
  const { watch, setValue, reset } = methods;

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
      console.log('Fetched appointments:', response.data);
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
          <div className="text-center py-8 text-sm text-muted-foreground">
            {filteredAppointments.length === 0
              ? `No appointments scheduled for ${formattedDate}`
              : `Showing ${filteredAppointments.length} appointment(s)`}
          </div>
        )}
      </div>
    </FormProvider>
  );
}
