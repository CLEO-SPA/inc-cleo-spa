/*
 * AppointmentList Component
 * --------------------------------------------------
 * Paginated, filterable list view of appointments.
 * - Filters: employee, member, start / end date
 * - Pagination: server-side (10 per page) with ShadCN <Pagination />
 * - URL-agnostic (no query-string syncing here – purely internal state)
 * - Uses react-hook-form to manage filter controls.
 *
 * Author: <your-name>
 * Date:   <yyyy-mm-dd>
 */

// -------------------------
// Imports & setup
// -------------------------
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import MemberSelect   from '@/components/ui/forms/MemberSelect';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// -------------------------
// Helper formatters
// -------------------------
const formatDate = (dateStr) => format(new Date(dateStr), 'EEE, dd MMM');
const formatTime = (timeStr) => format(new Date(timeStr), 'HH:mm');

// =============================================================================
// Component
// =============================================================================
export default function AppointmentList() {
  /* -------------------------------------------------------------------------
   * react-hook-form: centralised form state for all filter controls.
   * defaultValues ensure controlled inputs and allow reset() later.
   * -----------------------------------------------------------------------*/
  const methods = useForm({
    defaultValues: {
      employee_id: null,
      member_id:   null,
      start_date:  '',
      end_date:    '',
    },
  });
  const { watch, reset } = methods;

  /* -------------------------------------------------------------------------
   * Core UI state (list + pagination + fetch status)
   * -----------------------------------------------------------------------*/
  const [appointments, setAppointments] = useState([]); // current page items
  const [page,        setPage]        = useState(1);    // 1-based index
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  /*
   * watch() makes the component re-render when any form field changes →
   * provides current snapshot of filter values.
   */
  const filters = watch();

  /* -------------------------------------------------------------------------
   * Data fetcher – calls /ab with query params based on filters & page.
   * -----------------------------------------------------------------------*/
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        employeeId: filters.employee_id || undefined,
        memberId:   filters.member_id   || undefined,
        startDate:  filters.start_date  || undefined,
        endDate:    filters.end_date    || undefined,
        sortOrder:  'desc',
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

  /* -------------------------------------------------------------------------
   * Effect: trigger fetch whenever filters OR page changes.
   * -----------------------------------------------------------------------*/
  useEffect(() => {
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.employee_id, filters.member_id, filters.start_date, filters.end_date, page]);

  // -------------------------
  // Render helpers
  // -------------------------
  const hasActiveFilters =
    filters.employee_id || filters.member_id || filters.start_date || filters.end_date;

  /*
   * Renders <PaginationItem />s for page numbers, handling both small (<5 pages)
   * and large datasets with ellipses.
   */
  const renderPageNumbers = () => {
    const items = [];
    const addNumber = (n) =>
      items.push(
        <PaginationItem key={n}>
          <PaginationLink isActive={n === page} onClick={() => setPage(n)}>
            {n}
          </PaginationLink>
        </PaginationItem>
      );

    if (totalPages <= 5) {
      // Small set → show all pages
      for (let n = 1; n <= totalPages; n++) addNumber(n);
    } else {
      // Large set → 1 … window … last
      addNumber(1);
      if (page > 3) items.push(<PaginationEllipsis key="left…" />);

      const start = Math.max(2, page - 1);
      const end   = Math.min(totalPages - 1, page + 1);
      for (let n = start; n <= end; n++) addNumber(n);

      if (page < totalPages - 2) items.push(<PaginationEllipsis key="right…" />);
      addNumber(totalPages);
    }
    return items;
  };

  // =============================================================================
  // JSX
  // =============================================================================
  return (
    <FormProvider {...methods}>
      <div className="p-4 space-y-4">
        {/* ------------------------------------------------------------------
         * Toolbar – filters + clear button
         * ----------------------------------------------------------------*/}
        <div className="flex flex-wrap gap-2 items-end">
          <EmployeeSelect name="employee_id" label="Employee" />
          <MemberSelect   name="member_id"   label="Member" />

          {/* Date range pickers */}
          <div className="flex flex-col">
            <label className="text-xs">Start Date</label>
            <input
              type="date"
              {...methods.register('start_date')}
              className="border rounded px-2 h-8 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">End Date</label>
            <input
              type="date"
              {...methods.register('end_date')}
              className="border rounded px-2 h-8 text-sm"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={() => reset()}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* ------------------------------------------------------------------
         * Results list or states (loading / error)
         * ----------------------------------------------------------------*/}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="text-sm text-muted-foreground">
              Total Appointments: {totalCount}
            </div>

            {/* List items */}
            {appointments.map((a) => (
              <div
                key={a.id}
                className="border p-4 rounded shadow-sm bg-white flex justify-between items-center"
              >
                <div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(a.appointment_date)}
                  </div>
                  <div className="font-medium text-base">
                    {formatTime(a.start_time)} – {formatTime(a.end_time)}
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

            {/* Pagination – only when there are results */}
            {appointments.length > 0 && (
              <Pagination>
                <PaginationContent>
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      aria-label="Previous page"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>

                  {/* Dynamic page numbers */}
                  {renderPageNumbers()}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      aria-label="Next page"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </FormProvider>
  );
}