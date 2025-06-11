import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function PositionTablePage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchPositions = async (page = 1, limit = 10) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`/api/position?${params}`);
      if (!response.ok) throw new Error('Failed to fetch positions');

      const data = await response.json();
      setPositions(data.data || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setPageSize(data.pageSize || 10);
    } catch (err) {
      setError(err.message);
      setPositions([]);
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions(currentPage, pageSize);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPositions(page, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchPositions(1, newSize);
  };

  const navigateToCreate = () => {
    window.location.href = '/positions/create';
  };

  const navigateToEdit = (position) => {
    window.location.href = `/positions/edit/${position.id}`;
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const response = await fetch(`/api/positions/${selectedPosition.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete position');
      }

      setSuccess('Position deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPosition(null);
      fetchPositions(currentPage, pageSize);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (position) => {
    try {
      const response = await fetch(`/api/positions/${position.id}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle position status');
      }

      setSuccess(`Position ${position.position_is_active ? 'deactivated' : 'activated'} successfully`);
      fetchPositions(currentPage, pageSize);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openDeleteDialog = (position) => {
    setSelectedPosition(position);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generatePageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className='text-2xl font-bold'>Position Management</h1>
                  <p className="text-sm text-muted-foreground">Manage spa positions and roles</p>
                </div>
                <Button onClick={navigateToCreate} className="bg-black hover:bg-gray-800">
                  <Plus className="mr-2 h-4 w-4" /> Add Position
                </Button>
              </div>

              {error && (
                <Alert className='border-red-200 bg-red-50'>
                  <AlertCircle className='h-4 w-4 text-red-600' />
                  <AlertDescription className='text-red-800'>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>{success}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg">Display Options</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Label>Show:</Label>
                    <select value={pageSize} onChange={(e) => handlePageSizeChange(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Positions ({positions.length} of {totalPages * pageSize})</CardTitle></CardHeader>
  
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading positions...</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4 font-medium">Position Name</th>
                              <th className="text-left p-4 font-medium">Description</th>
                              <th className="text-left p-4 font-medium">Status</th>
                              <th className="text-left p-4 font-medium">Created</th>
                              <th className="text-left p-4 font-medium">Updated</th>
                              <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions.map((position) => (
                              <tr key={position.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{position.position_name}</td>
                                <td className="p-4 max-w-xs">
                                  <div className="truncate" title={position.position_description}>{position.position_description}</div>
                                </td>
                                <td className="p-4">
                                  <Badge variant={position.position_is_active ? "default" : "secondary"}>{position.position_is_active ? "Active" : "Inactive"}</Badge>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">{formatDate(position.position_created_at)}</td>
                                <td className="p-4 text-sm text-muted-foreground">{formatDate(position.position_updated_at)}</td>
                                <td className="p-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigateToEdit(position)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleStatus(position)}>
                                        {position.position_is_active ? (
                                          <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
                                        ) : (
                                          <><Power className="mr-2 h-4 w-4" /> Activate</>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openDeleteDialog(position)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {positions.length === 0 && !loading && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No positions found. Create your first position to get started.
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPages * pageSize)} of {totalPages * pageSize} results
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            {generatePageNumbers().map((page) => (
                              <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="w-8">{page}</Button>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Position</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{selectedPosition?.position_name}"? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
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