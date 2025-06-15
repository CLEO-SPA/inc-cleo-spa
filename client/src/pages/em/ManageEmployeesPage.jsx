// ManageEmployeePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/services/api';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Plus, MoreHorizontal, Edit,
  Trash2, Loader2, CheckCircle
} from 'lucide-react';

export default function ManageEmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const fetchEmployees = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/employee?page=${page}&limit=${limit}`);
      const data = res.data;
      setEmployees(data.data || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setPageSize(data.pageSize || 10);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToEdit = (employee) => {
    navigate(`/employees/update/${employee.id}`);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
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
              <div className="flex items-center justify-between">
                <h1 className='text-2xl font-bold'>Manage Employees</h1>
              </div>

              {success && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader><CardTitle>Display Options</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Show:</span>
                    <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">
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
                  <div className="mb-2 text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} employees
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : employees.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No employees found.</div>
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
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee, index) => (
                            <TableRow key={employee.id}>
                              <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                              <TableCell>{employee.employee_name}</TableCell>
                              <TableCell>{employee.employee_email}</TableCell>
                              <TableCell>
                                <Badge className={employee.employee_is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                                  {employee.employee_is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {employee.positions.map((pos) => (
                                    <Badge key={pos.position_id} className="bg-blue-100 text-blue-700">{pos.position_name}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(employee.created_at)}</TableCell>
                              <TableCell>{formatDate(employee.updated_at)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigateToEdit(employee)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Pagination className="mt-4">
                        <PaginationContent>
                          {currentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
                            </PaginationItem>
                          )}
                          {generatePageNumbers().map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink isActive={page === currentPage} onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
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
