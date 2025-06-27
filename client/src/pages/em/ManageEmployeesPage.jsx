// ManageEmployeePage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function ManageEmployeePage() {
  const navigate = useNavigate();
  const {
    employees,
    pagination,
    isFetchingList: loading,
    isRegenerating: regenerateLoading,
    error,
    success,
    fetchAllEmployees,
    regenerateInviteLink,
    setCurrentPage,
    setPageSize,
    resetMessages,
  } = useEmployeeStore();

  const { currentPage, totalPages, totalCount, pageSize } = pagination;

  useEffect(() => {
    fetchAllEmployees();
    return () => {
      resetMessages();
    };
  }, [fetchAllEmployees, resetMessages]);

  const isInviteExpired = (employee) => {
    if (employee.verification_status === 'Verified') return false;
    const expiryTime = new Date(employee.updated_at).getTime() + 3 * 24 * 60 * 60 * 1000; // 3 days
    return Date.now() > expiryTime;
  };

  const handleRegenerate = async (employee) => {
    await regenerateInviteLink(employee);
  };

  const navigateToEdit = (employee) => {
    navigate(`/employees/update/${employee.id}`);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const generatePageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4'>
              <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Manage Employees</h1>
              </div>

              {success && (
                <Alert variant='success'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant='destructive'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Display Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm'>Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(parseInt(e.target.value))}
                      className='border rounded px-2 py-1 text-sm'
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className='mb-2 text-sm text-muted-foreground'>
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of{' '}
                    {totalCount} employees
                  </div>

                  {loading ? (
                    <div className='flex justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin' />
                    </div>
                  ) : employees.length === 0 ? (
                    <div className='text-center text-sm text-muted-foreground py-6'>No employees found.</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Positions</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee, index) => (
                            <TableRow key={employee.id}>
                              <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                              <TableCell>{employee.employee_name}</TableCell>
                              <TableCell>{employee.employee_email}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    employee.employee_is_active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-muted text-muted-foreground'
                                  }
                                >
                                  {employee.verification_status === 'Verified' && employee.employee_is_active
                                    ? 'Active'
                                    : 'UnVerified'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className='flex flex-wrap gap-1'>
                                  {employee.positions.map((pos) => (
                                    <Badge key={pos.position_id} className='bg-blue-100 text-blue-700'>
                                      {pos.position_name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(employee.created_at)}</TableCell>
                              <TableCell>{formatDate(employee.updated_at)}</TableCell>
                              <TableCell className='text-right'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' className='h-8 w-8 p-0'>
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuItem onClick={() => navigateToEdit(employee)}>
                                      <Edit className='mr-2 h-4 w-4' /> Edit
                                    </DropdownMenuItem>
                                    {isInviteExpired(employee) && (
                                      <DropdownMenuItem
                                        onClick={() => handleRegenerate(employee)}
                                        disabled={regenerateLoading === employee.id}
                                      >
                                        {regenerateLoading === employee.id ? (
                                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        ) : (
                                          <RefreshCw className='mr-2 h-4 w-4' />
                                        )}
                                        Regenerate Invite
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Pagination className='mt-4'>
                        <PaginationContent>
                          {currentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
                            </PaginationItem>
                          )}
                          {generatePageNumbers().map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          {currentPage < totalPages && (
                            <PaginationItem>
                              <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} />
                            </PaginationItem>
                          )}
                        </PaginationContent>
                      </Pagination>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
