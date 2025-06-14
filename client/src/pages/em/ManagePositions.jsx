// PositionTablePage.jsx
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
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Plus, MoreHorizontal, Edit,
  Trash2, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function PositionTablePage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPositions(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const fetchPositions = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      const response = await api.get(`/position?${params}`);
      const data = response.data;
      setPositions(data.data || []);
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

  const navigateToCreate = () => {
    navigate('/positions/create');
  };

  const navigateToEdit = (position) => {
    navigate(`/positions/update/${position.id}`);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/position/${selectedPosition.id}`);
      setSuccess('Position deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPosition(null);
      fetchPositions(currentPage, pageSize);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteDialog = (position) => {
    setError('');
    setSelectedPosition(position);
    setDeleteDialogOpen(true);
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
                <h1 className='text-2xl font-bold'>Manage Positions</h1>
                <Button onClick={navigateToCreate}><Plus className="mr-2 h-4 w-4" /> Add Position</Button>
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
                    <Label>Show:</Label>
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
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} positions
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : positions.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No positions found.</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Position Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {positions.map((position, index) => (
                            <TableRow key={position.id}>
                              <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                              <TableCell>{position.position_name}</TableCell>
                              <TableCell className="truncate max-w-[200px]">{position.position_description}</TableCell>
                              <TableCell>
                                <Badge className={position.position_is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                                  {position.position_is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(position.position_created_at)}</TableCell>
                              <TableCell>{formatDate(position.position_updated_at)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigateToEdit(position)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteDialog(position)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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

              <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setDeleteDialogOpen(false);
                  setSelectedPosition(null);
                  setError('');
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Position</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete: <span className="font-semibold">{selectedPosition?.position_name}</span>?
                    </DialogDescription>
                  </DialogHeader>

                  {error && (
                    <div className="mt-4 rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
                      {formLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>) : 'Delete Position'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
