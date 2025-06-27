/* ============================================================================
 * AppointmentList
 * ----------------------------------------------------------------------------
 * Paginated, filterable list of appointments.
 * - Filters: employee, member, start / end date
 * - Pagination: server-side (10 per page) with ShadCN <Pagination />
 * - Uses react-hook-form for a single source of truth for filter inputs.
 * - Auto-resets to page 1 when filters change and never requests an invalid
 *   page (will clamp to last available page if server shrinks result set).
 * ==========================================================================*/

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

/* ---------------------------------------------------------------------------
 * Tiny helpers: date / time formatting
 * -------------------------------------------------------------------------*/
const formatDate = (dateStr) => format(new Date(dateStr), 'EEE, dd MMM');
const formatTime = (timeStr) => format(new Date(timeStr), 'HH:mm');

export default function AppointmentList() {
  /* ────────────────────────────────
   * 1. Form / filter state
   * ────────────────────────────────*/
  const methods = useForm({
    defaultValues: {
      employee_id: null,
      member_id:   null,
      start_date:  '',
      end_date:    '',
    },
  });
  const { watch, reset } = methods;            // react-hook-form helpers
  const filters = watch();                     // live snapshot of form values

  /* ────────────────────────────────
   * 2. Core data & pagination state
   * ────────────────────────────────*/
  const [appointments, setAppointments] = useState([]); // items for current page
  const [page,        setPage]        = useState(1);    // 1-based page index
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  /* Quick boolean to show / hide “Clear Filters” button */
  const hasActiveFilters =
    filters.employee_id || filters.member_id || filters.start_date || filters.end_date;

  /* ────────────────────────────────
   * 3. Reset page → 1 on filter change
   *    (prevents fetching stale, out-of-range pages)
   * ────────────────────────────────*/
  useEffect(() => {
    setPage(1);                    // always jump back to first page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.employee_id, filters.member_id, filters.start_date, filters.end_date]);

  /* ────────────────────────────────
   * 4. Fetch appointments from backend
   * ────────────────────────────────*/
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      /* Build query-string params from state */
      const params = {
        page,
        limit: 10,
        employeeId: filters.employee_id || undefined,
        memberId:   filters.member_id   || undefined,
        startDate:  filters.start_date  || undefined,
        endDate:    filters.end_date    || undefined,
        sortOrder:  'desc',
      };

      /* GET /ab?page=… */
      const res = await api.get('/ab', { params });

      /* If we somehow asked for a page beyond last, clamp and exit.
         A second effect run will refetch with the corrected page. */
      if (page > res.data.totalPages && res.data.totalPages > 0) {
        setPage(res.data.totalPages);
        return;
      }

      /* Normal success path */
      setAppointments(res.data.data);
      setTotalPages(Math.max(res.data.totalPages, 1));  // guard against 0
      setTotalCount(res.data.totalCount);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  /* Trigger fetch when PAGE or FILTERS change */
  useEffect(() => {
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.employee_id, filters.member_id, filters.start_date, filters.end_date]);

  /* ────────────────────────────────
   * 5. Pagination helper – renders page numbers with ellipses
   * ────────────────────────────────*/
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
      // Small dataset → show all page numbers
      for (let n = 1; n <= totalPages; n++) addNumber(n);
    } else {
      // Large dataset → 1 … (window) … last
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

  /* ────────────────────────────────
   * 6. Render
   * ────────────────────────────────*/
  return (
    <FormProvider {...methods}>
      <div className="p-4 space-y-4">
        {/* ────────────── Filter toolbar ────────────── */}
        <div className="flex flex-wrap gap-2 items-end">
          <EmployeeSelect name="employee_id" label="Employee" />
          <MemberSelect   name="member_id"   label="Member" />

          {/* Date range (plain <input type="date"> to keep bundle small) */}
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

        {/* ────────────── Results / loading / error states ────────────── */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {/* Summary line */}
            <div className="text-sm text-muted-foreground">
              Total Appointments: {totalCount}
            </div>

            {/* Individual appointment cards */}
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

                {/* Actions */}
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

            {/* Pagination controls (only if there are any appointments) */}
            {appointments.length > 0 && (
              <Pagination>
                <PaginationContent>
                  {/* Previous button */}
                  <PaginationItem>
                    <PaginationPrevious
                      aria-label="Previous page"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {renderPageNumbers()}

                  {/* Next button */}
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