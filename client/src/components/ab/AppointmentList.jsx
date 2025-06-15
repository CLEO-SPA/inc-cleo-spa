import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect from '@/components/ui/forms/MemberSelect';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AppointmentList() {
  const methods = useForm({ defaultValues: { employee_id: null, member_id: null, start_date: '', end_date: '' } });
  const { watch, reset } = methods;

  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filters = watch();

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        employeeId: filters.employee_id || undefined,
        memberId: filters.member_id || undefined,
        startDate: filters.start_date || undefined,
        endDate: filters.end_date || undefined,
        sortOrder: 'desc'
      };
      const res = await api.get('/ab', { params });
      setAppointments(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filters.employee_id, filters.member_id, filters.start_date, filters.end_date, page]);

  const formatDate = (dateStr) => format(new Date(dateStr), 'EEE, dd MMM');
  const formatTime = (timeStr) => format(new Date(timeStr), 'HH:mm');

  return (
    <FormProvider {...methods}>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <EmployeeSelect name="employee_id" label="Employee" />
          <MemberSelect name="member_id" label="Member" />
          <div className="flex flex-col">
            <label className="text-xs">Start Date</label>
            <input type="date" {...methods.register('start_date')} className="border rounded px-2 h-8 text-sm" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">End Date</label>
            <input type="date" {...methods.register('end_date')} className="border rounded px-2 h-8 text-sm" />
          </div>
          {(filters.employee_id || filters.member_id || filters.start_date || filters.end_date) && (
            <Button size="sm" variant="outline" onClick={() => reset()}>Clear Filters</Button>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Total Appointments: {totalCount}</div>

            {appointments.map((a) => (
              <div key={a.id} className="border p-4 rounded shadow-sm bg-white flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">{formatDate(a.appointment_date)}</div>
                  <div className="font-medium text-base">
                    {formatTime(a.start_time)} - {formatTime(a.end_time)}
                  </div>
                  <div className="text-sm">{a.remarks}</div>
                  <div className="text-xs text-muted-foreground">
                    Member: {a.member_name} | Staff: {a.servicing_employee_name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/appointments/${a.id}`}>View</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/appointments/edit/${a.id}`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}