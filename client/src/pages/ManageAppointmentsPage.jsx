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
import { Calendar, Clock, User, UserCheck, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';

export default function CreateAppointmentPage() {
  const [formData, setFormData] = useState({
    member_id: '',
    servicing_employee_id: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    remarks: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Mock data - replace with actual API calls
  const members = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
    { id: 4, name: 'Sarah Wilson' }
  ];

  const employees = [
    { id: 1, name: 'Dr. Anderson' },
    { id: 2, name: 'Dr. Brown' },
    { id: 3, name: 'Dr. Davis' },
    { id: 4, name: 'Dr. Miller' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.member_id) return 'Please select a member';
    if (!formData.servicing_employee_id) return 'Please select a servicing employee';
    if (!formData.appointment_date) return 'Please select an appointment date';
    if (!formData.start_time) return 'Please select a start time';
    if (!formData.end_time) return 'Please select an end time';
    
    // Validate time logic
    if (formData.start_time >= formData.end_time) {
      return 'End time must be after start time';
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
      // Replace with actual API call
      const response = await fetch('/api/ab/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          member_id: parseInt(formData.member_id),
          servicing_employee_id: parseInt(formData.servicing_employee_id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      const result = await response.json();
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          member_id: '',
          servicing_employee_id: '',
          appointment_date: '',
          start_time: '',
          end_time: '',
          remarks: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred while creating the appointment');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Page Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Create New Appointment</h1>
                  <p className="text-muted-foreground">
                    Schedule a new appointment with your team members
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Appointments
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className="max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Appointment Details
                    </CardTitle>
                    <CardDescription>
                      Fill in the information below to create a new appointment
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Appointment created successfully!
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-6">
                      {/* Member Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="member" className="flex items-center gap-2 text-sm font-medium">
                          <User className="w-4 h-4" />
                          Member
                        </Label>
                        <Select
                          value={formData.member_id}
                          onValueChange={(value) => handleInputChange('member_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Employee Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="employee" className="flex items-center gap-2 text-sm font-medium">
                          <UserCheck className="w-4 h-4" />
                          Servicing Employee
                        </Label>
                        <Select
                          value={formData.servicing_employee_id}
                          onValueChange={(value) => handleInputChange('servicing_employee_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date and Time Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Appointment Date */}
                        <div className="space-y-2">
                          <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="w-4 h-4" />
                            Date
                          </Label>
                          <Input
                            type="date"
                            id="date"
                            min={today}
                            value={formData.appointment_date}
                            onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                          />
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Start Time
                          </Label>
                          <Input
                            type="time"
                            id="start-time"
                            value={formData.start_time}
                            onChange={(e) => handleInputChange('start_time', e.target.value)}
                          />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            End Time
                          </Label>
                          <Input
                            type="time"
                            id="end-time"
                            value={formData.end_time}
                            onChange={(e) => handleInputChange('end_time', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="space-y-2">
                        <Label htmlFor="remarks" className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="w-4 h-4" />
                          Remarks (Optional)
                        </Label>
                        <Textarea
                          id="remarks"
                          placeholder="Add any additional notes or special requirements..."
                          value={formData.remarks}
                          onChange={(e) => handleInputChange('remarks', e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => window.history.back()}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Create Appointment
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}