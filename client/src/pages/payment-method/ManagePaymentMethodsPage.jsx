import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from 'lucide-react';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';


function ManagePaymentMethodsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    paymentMethods,
    currentPage,
    currentLimit,
    totalPages,
    totalCount,
    searchTerm,
    isFetching,
    isDeleting,
    error,
    errorMessage,
    fetchPaymentMethods,
    deletePaymentMethod,
    setSelectedPaymentMethodId,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setLimit,
    setSearchTerm,
  } = usePaymentMethodStore();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Separate state for deletion errors
  const [deleteError, setDeleteError] = useState(null);

  // Local state for form inputs only
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  const [targetPageInput, setTargetPageInput] = useState('');

  // Initialize search input with store value
  useEffect(() => {
    setInputSearchTerm(searchTerm || '');
  }, [searchTerm]);

  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearchTerm);
    setTargetPageInput(''); // Clear input after search
    // Clear any previous delete errors when searching
    setDeleteError(null);
  };

  const handleLimitChange = (value) => {
    const newLimit = parseInt(value, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setLimit(newLimit);
      // Clear any previous delete errors when changing limit
      setDeleteError(null);
    }
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      goToPage(pageNum);
      setTargetPageInput(''); // Clear input after navigation
      // Clear any previous delete errors when navigating
      setDeleteError(null);
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages || 1}`);
    }
  };

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const pageNumbers = useMemo(() => {
    if (!totalPages) return [];
    const pages = [];
    const maxPagesToShow = 5; // Show 5 page numbers at a time
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  const handleEdit = (id) => {
    setSelectedPaymentMethodId(id);
    navigate(`/payment-method/edit/${id}`); // Adjust route as needed
  };

  const handleCreate = () => {
    navigate('/payment-method/create'); // Adjust route as needed
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
    // Clear any previous delete errors when opening dialog
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      // Clear any previous delete errors
      setDeleteError(null);
      
      const result = await deletePaymentMethod(deleteId);
      if (result.success) {
        // Success - close dialog and clear state
        setShowDeleteDialog(false);
        setDeleteId(null);
      } else {
        // Error - show the error in component state instead of letting it bubble to store error
        setDeleteError(result.error || 'Failed to delete payment method');
        setShowDeleteDialog(false);
        setDeleteId(null);
        
        // Immediately refresh data to clear the store error state
        // This prevents the duplicate error display
        setTimeout(() => {
          fetchPaymentMethods();
        }, 100);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
    setDeleteError(null);
  };

  const dismissDeleteError = () => {
    setDeleteError(null);
  };

  // --- Role-based access ---
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
  const canDelete = user?.role === 'super_admin';
  const canCreate = user?.role === 'super_admin' || user?.role === 'data_admin';

  // --- Table headers for payment methods ---
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'payment_method_name', label: 'Payment Method' },
    { key: 'is_enabled', label: 'Active' },
    { key: 'is_revenue', label: 'Revenue' },
    { key: 'show_on_payment_page', label: 'Show on payment page' },
    { key: 'created_at', label: 'Created' },
    { key: 'updated_at', label: 'Updated' },
    { key: 'actions', label: 'Actions' },
  ];

  // Only show loading spinner if fetching and no data exists
  if (isFetching && !paymentMethods.length) {
    return <div className='flex justify-center items-center h-screen'>Loading payment methods...</div>;
  }

  // Only show error page for fetch errors during initial load
  if (error && !paymentMethods.length) {
    return (
      <div className='text-red-500 text-center mt-10'>
        Error loading payment methods: {errorMessage || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='container mx-auto p-4 space-y-6'>
              {/* Error Alert - Only show store errors for non-delete operations */}
              {error && paymentMethods.length > 0 && !deleteError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{errorMessage || 'An error occurred'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        fetchPaymentMethods();
                      }}
                      className="h-auto p-1 hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Delete Error Alert */}
              {deleteError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{deleteError}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissDeleteError}
                      className="h-auto p-1 hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                  <div>
                    <CardTitle>Payment Methods Management</CardTitle>
                    {totalCount > 0 && (
                      <p className='text-sm text-muted-foreground'>
                        Showing {paymentMethods.length} of {totalCount} payment methods
                      </p>
                    )}
                  </div>
                  {canCreate && (
                    <Button onClick={handleCreate} className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Add Payment Method
                    </Button>
                  )}
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Search and Limit Controls */}
                  <div className='flex flex-col sm:flex-row gap-4 items-end'>
                    <form onSubmit={handleSearchSubmit} className='flex-grow sm:flex-grow-0'>
                      <div className='flex items-center gap-2'>
                        <Input
                          id='search'
                          type='text'
                          placeholder='Search payment methods...'
                          value={inputSearchTerm}
                          onChange={(e) => setInputSearchTerm(e.target.value)}
                          className='w-64'
                        />
                        <Button type='submit' disabled={isFetching}>
                          Search
                        </Button>
                      </div>
                    </form>

                    <div className='flex items-end gap-2'>
                      <Label htmlFor='limit' className='mb-2'>
                        Items per page:
                      </Label>
                      <Select
                        value={currentLimit.toString()}
                        onValueChange={handleLimitChange}
                        disabled={isFetching}
                      >
                        <SelectTrigger id='limit' className='w-[80px]'>
                          <SelectValue placeholder={currentLimit} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='5'>5</SelectItem>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='20'>20</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableHeaders.map((header) => (
                            <TableHead key={header.key} className={header.key === 'actions' ? 'text-right' : ''}>
                              {header.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isFetching && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              Loading...
                            </TableCell>
                          </TableRow>
                        )}
                        {!isFetching && paymentMethods.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              {searchTerm ? 'No payment methods found matching your search.' : 'No payment methods found.'}
                            </TableCell>
                          </TableRow>
                        )}
                        {!isFetching &&
                          paymentMethods.map((paymentMethod) => (
                            <TableRow key={paymentMethod.id}>
                              {tableHeaders.map((header) => {
                                if (header.key === 'actions') {
                                  return (
                                    <TableCell key={header.key} className='text-right'>
                                      <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant='ghost' 
                                            className='h-8 w-8 p-0'
                                            aria-label={`Actions for payment method ${paymentMethod.payment_method_name || paymentMethod.id}`}
                                          >
                                            <span className='sr-only'>Open menu</span>
                                            <MoreHorizontal className='h-4 w-4' />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end' className='w-[160px]'>
                                          {canEdit && (
                                            <DropdownMenuItem 
                                              onClick={() => handleEdit(paymentMethod.id)}
                                              className='cursor-pointer'
                                            >
                                              <Edit className='mr-2 h-4 w-4' />
                                              Edit
                                            </DropdownMenuItem>
                                          )}
                                          {canDelete && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() => handleDeleteClick(paymentMethod.id)}
                                                className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer'
                                                disabled={isDeleting}
                                              >
                                                <Trash2 className='mr-2 h-4 w-4' />
                                                Delete
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  );
                                }

                                if (header.key === 'created_at' || header.key === 'updated_at') {
                                  const date = paymentMethod[header.key];
                                  return (
                                    <TableCell key={header.key}>
                                      {date ? new Date(date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'N/A'}
                                    </TableCell>
                                  );
                                }

                                if (header.key === 'is_enabled' || header.key === 'is_revenue' || header.key === 'show_on_payment_page') {
                                  const status = paymentMethod[header.key];
                                  const displayText = status === true ? 'Yes' : status === false ? 'No' : status || 'N/A';
                                  return (
                                    <TableCell key={header.key}>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === true
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : status === false
                                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                        {displayText}
                                      </span>
                                    </TableCell>
                                  );
                                }
                                return (
                                  <TableCell key={header.key}>
                                    {paymentMethod[header.key] !== null && paymentMethod[header.key] !== undefined
                                      ? paymentMethod[header.key].toString()
                                      : 'N/A'}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter>
                  {/* Pagination Controls */}
                  {totalPages > 0 && (
                    <div className='flex flex-col sm:flex-row items-center justify-between w-full gap-4'>
                      <div className='text-sm text-muted-foreground'>
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => goToPage(1)}
                          disabled={!hasPreviousPage || isFetching}
                          aria-label="Go to first page"
                        >
                          <ChevronsLeft className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={goToPreviousPage}
                          disabled={!hasPreviousPage || isFetching}
                        >
                          <ChevronLeft className='h-4 w-4' />
                          Previous
                        </Button>
                        {pageNumbers.map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => goToPage(page)}
                            disabled={isFetching}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={goToNextPage}
                          disabled={!hasNextPage || isFetching}
                        >
                          Next
                          <ChevronRight className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => goToPage(totalPages)}
                          disabled={!hasNextPage || isFetching}
                          aria-label="Go to last page"
                        >
                          <ChevronsRight className='h-4 w-4' />
                        </Button>
                      </div>
                      <form onSubmit={handleGoToPage} className='flex items-center gap-2'>
                        <Label htmlFor='pageInput' className='sr-only'>
                          Go to page number
                        </Label>
                        <Input
                          id='pageInput'
                          type='number'
                          min='1'
                          max={totalPages}
                          placeholder='Page #'
                          value={targetPageInput}
                          onChange={(e) => setTargetPageInput(e.target.value)}
                          className='w-20 h-9'
                          disabled={isFetching}
                          aria-label='Page number input'
                        />
                        <Button type='submit' variant='outline' size='sm' disabled={isFetching}>
                          Go
                        </Button>
                      </form>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
          </SidebarInset>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this payment method? This action cannot be undone.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-400">
                  <strong>Warning:</strong> Deleting this will permanently remove it from your system.
                </p>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={cancelDelete} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarProvider>
    </div>
  );
}

export default ManagePaymentMethodsPage;