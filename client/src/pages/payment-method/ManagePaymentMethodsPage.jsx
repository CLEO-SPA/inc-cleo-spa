import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
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
  };

  const handleLimitChange = (value) => {
    const newLimit = parseInt(value, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setLimit(newLimit);
    }
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      goToPage(pageNum);
      setTargetPageInput(''); // Clear input after navigation
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

  // --- Action Handlers ---
  const handleView = (id) => {
    setSelectedPaymentMethodId(id);
    navigate(`/payment-method/${id}`); // Adjust route as needed
  };

  const handleEdit = (id) => {
    setSelectedPaymentMethodId(id);
    navigate(`/payment-method/edit/${id}`); // Adjust route as needed
  };

  const handleCreate = () => {
    navigate('/payment-method/create'); // Adjust route as needed
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      const result = await deletePaymentMethod(id);
      if (result.success) {
        alert('Payment method deleted successfully.');
      } else {
        alert(`Failed to delete payment method: ${result.error}`);
      }
    }
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

  if (isFetching && !paymentMethods.length) {
    // Show loading only if no data is present yet
    return <div className='flex justify-center items-center h-screen'>Loading payment methods...</div>;
  }

  if (error) {
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
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant='ghost' className='h-8 w-8 p-0'>
                                            <span className='sr-only'>Open menu</span>
                                            <MoreHorizontal className='h-4 w-4' />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end'>
                                          <DropdownMenuItem onClick={() => handleView(paymentMethod.id)}>
                                            <Eye className='mr-2 h-4 w-4' />
                                            View
                                          </DropdownMenuItem>
                                          {canEdit && (
                                            <DropdownMenuItem onClick={() => handleEdit(paymentMethod.id)}>
                                              <Edit className='mr-2 h-4 w-4' />
                                              Edit
                                            </DropdownMenuItem>
                                          )}
                                          {canDelete && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() => handleDelete(paymentMethod.id)}
                                                className='text-destructive focus:text-destructive focus:bg-destructive/10'
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
                                      {date ? new Date(date).toUTCString() : 'N/A'}
                                    </TableCell>
                                  );
                                }

                                if (header.key === 'is_enabled' || header.key === 'is_revenue' || header.key === 'show_on_payment_page') {
                                  const status = paymentMethod[header.key];
                                  const displayText = status === true ? 'True' : status === false ? 'False' : status || 'N/A';
                                  return (
                                    <TableCell key={header.key}>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === true
                                          ? 'bg-green-100 text-green-800'
                                          : status === false
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-red-100 text-red-800'
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
                        >
                          <ChevronsRight className='h-4 w-4' />
                        </Button>
                      </div>
                      <form onSubmit={handleGoToPage} className='flex items-center gap-2'>
                        <Input
                          type='number'
                          min='1'
                          max={totalPages}
                          placeholder='Page #'
                          value={targetPageInput}
                          onChange={(e) => setTargetPageInput(e.target.value)}
                          className='w-20 h-9'
                          disabled={isFetching}
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
      </SidebarProvider>
    </div>
  );
}

export default ManagePaymentMethodsPage;