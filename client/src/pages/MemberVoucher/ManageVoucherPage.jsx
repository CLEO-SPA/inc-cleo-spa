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
} from 'lucide-react';
import { useVoucherPaginationStore } from '@/stores/MemberVoucher/useVoucherPaginationStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

function ManageVouchersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    vouchers,
    currentPage,
    currentLimit,
    hasNextPage,
    hasPreviousPage,
    searchTerm,
    totalCount,
    isLoading,
    error,
    initializePagination,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    setSearchTerm,
    setLimit,
  } = useVoucherPaginationStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);
  const [targetPageInput, setTargetPageInput] = useState('');

  useEffect(() => {
    // Initialize with a default limit and empty search term if not already set
    initializePagination(currentLimit || 10, searchTerm || '');
  }, [initializePagination, currentLimit, searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearchTerm);
    goToPage(1); // Reset to first page on new search
  };

  const handleLimitChange = (value) => {
    const newLimit = parseInt(value, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setLimit(newLimit);
      goToPage(1); // Reset to first page on limit change
    }
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!isNaN(pageNum) && pageNum > 0 && totalCount && pageNum <= Math.ceil(totalCount / currentLimit)) {
      goToPage(pageNum);
      setTargetPageInput(''); // Clear input after navigation
    } else if (totalCount === null) {
      alert('Total count not yet available to jump by page number.');
    } else {
      alert(`Please enter a valid page number between 1 and ${Math.ceil(totalCount / currentLimit) || 1}`);
    }
  };

  const totalPages = totalCount ? Math.ceil(totalCount / currentLimit) : 0;

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
    navigate(`/mv/${id}/consume`); // Adjust route as needed
  };

  const handleEdit = (id) => {
    navigate(`/care-packages/${id}/edit`); // Adjust route as needed
  };

  const handleDelete = async (id) => {
    // Example: You might want to show a confirmation dialog first
    if (window.confirm('Are you sure you want to delete this care package?')) {
      try {
        // await api.delete(`/care-packages/${id}`); // Replace with your actual API call
        alert(`Care package ${id} deleted (simulated).`);
        // Optionally, re-fetch data or update store
        initializePagination(currentLimit, searchTerm); // Re-initialize to refresh data
      } catch (err) {
        console.error('Failed to delete care package:', err);
        alert('Failed to delete care package.');
      }
    }
  };

  // --- Role-based access ---
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
  const canDelete = user?.role === 'super_admin';

  // --- Placeholder for care package fields ---
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'member_voucher_name', label: 'Member Voucher Name' },
    { key: 'current_balance', label: 'Current Balance' },
    { key: 'starting_balance', label: 'Starting Balance' },
    { key: 'free_of_charge', label: 'Free Of Charge (FOC)' },
    { key: 'default_total_price', label: 'Default Total Price' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_at', label: 'Last Updated At' },
    { key: 'actions', label: 'Actions' },
  ];

  if (isLoading && !vouchers.length) {
    // Show loading only if no data is present yet
    return <div className='flex justify-center items-center h-screen'>Loading member vouchers...</div>;
  }

  if (error) {
    return (
      <div className='text-red-500 text-center mt-10'>
        Error loading member vouchers: {error.message || 'Unknown error'}
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
                <CardHeader>
                  <CardTitle>Voucher Management</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Search and Limit Controls */}
                  <div className='flex flex-col sm:flex-row gap-4 items-end'>
                    <form onSubmit={handleSearchSubmit} className='flex-grow sm:flex-grow-0 sm:w-1/3'>
                      <Label htmlFor='search' className='sr-only'>
                        Search
                      </Label>
                      <div className='flex gap-2'>
                        <Input
                          id='search'
                          type='text'
                          placeholder='Search vouchers...'
                          value={inputSearchTerm}
                          onChange={(e) => setInputSearchTerm(e.target.value)}
                        />
                        <Button type='submit'>Search</Button>
                      </div>
                    </form>
                    <div className='flex items-end gap-2'>
                      <Label htmlFor='limit' className='mb-2'>
                        Items per page:
                      </Label>
                      <Select value={currentLimit.toString()} onValueChange={handleLimitChange}>
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
                        {isLoading &&
                          vouchers.length > 0 && ( // Show loading indicator over existing data
                            <TableRow>
                              <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                Updating data...
                              </TableCell>
                            </TableRow>
                          )}
                        {!isLoading && vouchers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              No Member Vouchers found.
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading &&
                          vouchers.map((voucher) => (
                            <TableRow key={voucher.id}>
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
                                          <DropdownMenuItem onClick={() => {
                                            const id = voucher.id;
                                            handleView(id);
                                            }}>
                                            <Eye className='mr-2 h-4 w-4' />
                                            View
                                          </DropdownMenuItem>
                                          {canEdit && (
                                            <DropdownMenuItem onClick={() => handleEdit(voucher.id)}>
                                              <Edit className='mr-2 h-4 w-4' />
                                              Edit
                                            </DropdownMenuItem>
                                          )}
                                          {canDelete && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() => handleDelete(voucher.id)}
                                                className='text-destructive focus:text-destructive focus:bg-destructive/10'
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
                                if (header.key === 'updated_at' || header.key === 'created_at') {
                                  return <TableCell key={header.key}>{voucher[header.key].toUTCString()}</TableCell>;
                                }
                                if (header.key === 'current_balance') {
                                  return <TableCell key={header.key}>{voucher[header.key] || '0'}</TableCell>;
                                }
                                return <TableCell key={header.key}>{voucher[header.key] || 'N/A'}</TableCell>;
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
                        Page {currentPage} of {totalPages} (Total: {totalCount} items)
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => goToPage(1)}
                          disabled={!hasPreviousPage || isLoading}
                        >
                          <ChevronsLeft className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={goToPreviousPage}
                          disabled={!hasPreviousPage || isLoading}
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
                            disabled={isLoading}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button variant='outline' size='sm' onClick={goToNextPage} disabled={!hasNextPage || isLoading}>
                          Next
                          <ChevronRight className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => goToPage(totalPages)}
                          disabled={!hasNextPage || isLoading}
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
                          disabled={isLoading}
                        />
                        <Button type='submit' variant='outline' size='sm' disabled={isLoading}>
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

export default ManageVouchersPage;