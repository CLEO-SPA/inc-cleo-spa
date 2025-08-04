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
import { Input } from '@/components/ui/input';
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
import { MoreHorizontal, Edit, RefreshCw, Loader2, CheckCircle, Search, Plus } from 'lucide-react';
import useEmployeeStore from '@/stores/useEmployeeStore';

export default function ManageEmployeePage() {
  const navigate = useNavigate();
  const {
    employees,
    pagination,
    isFetchingList: loading,
    error,
    success,
    fetchAllEmployees,
    regenerateInviteLink,
    setCurrentPage,
    setPageSize,
    resetMessages,
    searchQuery,
    setSearchQuery,
  } = useEmployeeStore();

  const { currentPage, totalPages, totalCount, pageSize } = pagination;

  useEffect(() => {
    fetchAllEmployees();
    return () => {
      resetMessages();
    };
  }, [fetchAllEmployees, resetMessages]);


  const navigateToEdit = (employee) => {
    navigate(`/employees/edit/${employee.id}`);
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

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAllEmployees();
  };

  const navigateToCreate = () => {
    navigate('/employees/create');
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
                <Button onClick={navigateToCreate}><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
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
                <CardContent className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex items-center gap-2'>
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

                  <div className='flex items-center gap-2 w-full sm:w-1/3'>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder='Search by name, email, or code'
                      className='h-9 text-sm'
                    />
                    <Button onClick={handleSearch} size='sm' className='h-9 px-3'>
                      <Search className='h-4 w-4' />
                    </Button>
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
                            <TableHead>Code</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Positions</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className='text-center'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee, index) => (
                            <TableRow key={employee.id}>
                              <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                              <TableCell>{employee.employee_name}</TableCell>
                              <TableCell>{employee.employee_email}</TableCell>
                              <TableCell>{employee.employee_code}</TableCell>
                              <TableCell>{employee.employee_contact || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    employee.employee_is_active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }
                                >
                                  {employee.employee_is_active ? 'Active' : 'Inactive'}
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
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Icon-only Edit Button */}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigateToEdit(employee)}
                                    className="w-8 h-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>

                                  {/* Commission Button with Short Label */}
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/cm/monthly-employee-commission?employeeId=${employee.id}&employeeName=${employee.employee_name}`)}
                                  >
                                    Commission
                                  </Button>
                                </div>
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
