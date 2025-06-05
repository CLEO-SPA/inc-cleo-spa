import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, Plus, Trash2 } from 'lucide-react';

export default function CreateAppointmentPage() {
  const [formData, setFormData] = useState({
    member_id: '',
    appointments: [
      {
        id: 1,
        servicing_employee_id: '',
        appointment_date: '',
        start_time: '',
        end_time: '',
        remarks: ''
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const members = [
    { id: 1, name: 'Yue Tong', phone: '93483434' },
    { id: 2, name: 'Jane Smith', phone: '91234567' },
    { id: 3, name: 'Mike Johnson', phone: '98765432' },
    { id: 4, name: 'Sarah Wilson', phone: '87654321' }
  ];

  const employees = [
    { id: 1, name: 'Tina' },
    { id: 2, name: 'Dr. Brown' },
    { id: 3, name: 'Dr. Davis' },
    { id: 4, name: 'Dr. Miller' }
  ];

  const generateTimeSlots = () => {
    const slots = [];
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date();
    end.setHours(17, 0, 0, 0);
    while (start < end) {
      const hours = start.getHours().toString().padStart(2, '0');
      const minutes = start.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleAppointmentChange = (appointmentId, field, value) => {
    setFormData(prev => ({
      ...prev,
      appointments: prev.appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, [field]: value } : apt
      )
    }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const addAppointment = () => {
    const newId = Math.max(...formData.appointments.map(apt => apt.id)) + 1;
    setFormData(prev => ({
      ...prev,
      appointments: [...prev.appointments, {
        id: newId,
        servicing_employee_id: '',
        appointment_date: '',
        start_time: '',
        end_time: '',
        remarks: ''
      }]
    }));
  };

  const removeAppointment = (appointmentId) => {
    if (formData.appointments.length > 1) {
      setFormData(prev => ({
        ...prev,
        appointments: prev.appointments.filter(apt => apt.id !== appointmentId)
      }));
    }
  };

  const validateForm = () => {
    if (!formData.member_id) return 'Please select a member';
    for (let i = 0; i < formData.appointments.length; i++) {
      const apt = formData.appointments[i];
      const aptNum = i + 1;
      if (!apt.servicing_employee_id) return `Please select a servicing employee for Appointment ${aptNum}`;
      if (!apt.appointment_date) return `Please select a date for Appointment ${aptNum}`;
      if (!apt.start_time) return `Please select a start time for Appointment ${aptNum}`;
      if (!apt.end_time) return `Please select an end time for Appointment ${aptNum}`;
      if (apt.start_time >= apt.end_time) return `End time must be after start time for Appointment ${aptNum}`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const appointmentPromises = formData.appointments.map(appointment => {
        return fetch('/api/ab/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: parseInt(formData.member_id),
            servicing_employee_id: parseInt(appointment.servicing_employee_id),
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            remarks: appointment.remarks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      });

      const responses = await Promise.all(appointmentPromises);
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) throw new Error(`Failed to create ${failedResponses.length} appointment(s)`);

      setSuccess(true);
      setTimeout(() => {
        setFormData({
          member_id: '',
          appointments: [{
            id: 1,
            servicing_employee_id: '',
            appointment_date: '',
            start_time: '',
            end_time: '',
            remarks: ''
          }]
        });
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while creating appointments');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className='text-sm text-muted-foreground'>Home / Appointments / Create Appointment</div>
              <h1 className='text-2xl font-bold'>Create an appointment</h1>

              {error && <Alert className='border-red-200 bg-red-50'><AlertDescription className='text-red-800'>{error}</AlertDescription></Alert>}
              {success && <Alert className='border-green-200 bg-green-50'><CheckCircle className='h-4 w-4 text-green-600' /><AlertDescription className='text-green-800'>Appointments created successfully!</AlertDescription></Alert>}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <Label>Choose member</Label>
                  <Select value={formData.member_id} onValueChange={(value) => handleInputChange('member_id', value)}>
                    <SelectTrigger className='h-12'><SelectValue placeholder='Select a member' /></SelectTrigger>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>{member.name} - {member.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.appointments.map((appointment, index) => (
                <Card key={appointment.id} className='relative'>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                    <CardTitle className='text-lg'>Appointment {index + 1}</CardTitle>
                    {formData.appointments.length > 1 && <Button variant='ghost' size='sm' onClick={() => removeAppointment(appointment.id)} className='text-red-500 hover:text-red-700 hover:bg-red-50'><Trash2 className='h-4 w-4' /></Button>}
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label>Appointment Date</Label>
                        <Input type='date' min={today} value={appointment.appointment_date} onChange={(e) => handleAppointmentChange(appointment.id, 'appointment_date', e.target.value)} className='h-12' />
                      </div>
                      <div className='space-y-2'>
                        <Label>Start Time</Label>
                        <Select value={appointment.start_time} onValueChange={(value) => handleAppointmentChange(appointment.id, 'start_time', value)}>
                          <SelectTrigger className='h-12'><SelectValue placeholder='Start time' /></SelectTrigger>
                          <SelectContent>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <Label>End Time</Label>
                        <Select value={appointment.end_time} onValueChange={(value) => handleAppointmentChange(appointment.id, 'end_time', value)}>
                          <SelectTrigger className='h-12'><SelectValue placeholder='End time' /></SelectTrigger>
                          <SelectContent>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <Label>Employee</Label>
                        <Select value={appointment.servicing_employee_id} onValueChange={(value) => handleAppointmentChange(appointment.id, 'servicing_employee_id', value)}>
                          <SelectTrigger className='h-12'><SelectValue placeholder='Select employee' /></SelectTrigger>
                          <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label>Remarks</Label>
                      <Textarea placeholder='Type your message here.' value={appointment.remarks} onChange={(e) => handleAppointmentChange(appointment.id, 'remarks', e.target.value)} className='min-h-[100px] resize-none' />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant='outline' onClick={addAppointment} className='w-full h-12 border-dashed border-2'><Plus className='mr-2 h-4 w-4' />Add more appointment</Button>
              <Button onClick={handleSubmit} disabled={loading} className='h-12 px-8 bg-black hover:bg-gray-800 text-white'>{loading ? (<div className='flex items-center gap-2'><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>Creating...</div>) : 'Create'}</Button>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
