import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export default function ViewAppointmentDetailsPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/ab/${id}`);
        if (!res.data || Object.keys(res.data).length === 0) {
          setError('Appointment does not exist');
        } else {
          setAppointment(res.data);
        }
      } catch (err) {
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-muted-foreground text-sm">Loading appointment...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Appointment Details</h1>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/appointments">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Appointments
                      </Link>
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Date:</strong> {appointment.appointment_date}</div>
                      <div><strong>Start Time:</strong> {appointment.start_time}</div>
                      <div><strong>End Time:</strong> {appointment.end_time}</div>
                      <div><strong>Remarks:</strong> {appointment.remarks}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Member & Employee</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Member Name:</strong> {appointment.member_name}</div>
                      <div><strong>Servicing Employee:</strong> {appointment.servicing_employee_name}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Created At:</strong> {appointment.created_at}</div>
                      <div><strong>Created By:</strong> {appointment.created_by_name || '-'}</div>
                      <div><strong>Updated At:</strong> {appointment.updated_at || '-'}</div>
                      <div><strong>Updated By:</strong> {appointment.updated_by_name || '-'}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
