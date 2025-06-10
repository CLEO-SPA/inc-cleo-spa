import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
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
import { useCpPaginationStore } from '@/stores/useCpPaginationStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';

function ManageCarePackagesPage() {
  const { user, statuses } = useAuth();
  const navigate = useNavigate();

  const {
    carePackages,
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
    purchaseCountData,
    isPurchaseCountLoading,
    purchaseCountError,
    fetchPurchaseCount,
  } = useCpPaginationStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);
  const [targetPageInput, setTargetPageInput] = useState('');

  useEffect(() => {
    // Initialize with a default limit and empty search term if not already set
    initializePagination(currentLimit || 10, searchTerm || '');
    // Fetch purchase count data when component mounts
    fetchPurchaseCount();
  }, [initializePagination, currentLimit, searchTerm, fetchPurchaseCount]);

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

  const getStatusNameById = (id) => {
    if (!statuses || statuses.length === 0) return 'Unknown';
    const status = statuses.find((s) => s.id == id);
    return status ? status.status_name : 'Unknown';
  };

  // helper function to get purchase count for a package
  const getPurchaseCountForPackage = (packageId) => {
    if (!purchaseCountData || !purchaseCountData[packageId]) {
      return { purchase_count: 0, is_purchased: false };
    }
    return purchaseCountData[packageId];
  };

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
    navigate(`/cp/${id}`); // Adjust route as needed
  };

  const handleEdit = (id) => {
    navigate(`/cp/${id}/edit`); // Adjust route as needed
  };

  const handleDelete = async (id) => {
    // Example: You might want to show a confirmation dialog first
    if (window.confirm('Are you sure you want to delete this care package?')) {
      try {
        // await api.delete(`/care-packages/${id}`); // Replace with your actual API call
        alert(`Care package ${id} deleted (simulated).`);
        // Optionally, re-fetch data or update store
        initializePagination(currentLimit, searchTerm);
        fetchPurchaseCount(); 
      } catch (err) {
        console.error('Failed to delete care package:', err);
        alert('Failed to delete care package.');
      }
    }
  };

  // --- Role-based access ---
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
  const canDelete = user?.role === 'super_admin';

  // --- Updated table headers to include purchase count ---
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'care_package_name', label: 'Package Name' },
    { key: 'care_package_price', label: 'Price' },
    { key: 'care_package_status', label: 'Status' },
    { key: 'purchase_count', label: 'Purchase Count' },
    { key: 'updated_at', label: 'Last Updated' },
    { key: 'actions', label: 'Actions' },
  ];

  if (isLoading && !carePackages.length) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
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
                  <CardTitle>Care Packages Management</CardTitle>
                  {isPurchaseCountLoading && (
                    <div className='text-sm text-muted-foreground'>Loading purchase data...</div>
                  )}
                  {purchaseCountError && (
                    <div className='text-sm text-red-600'>Error loading purchase data: {purchaseCountError}</div>
                  )}
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
                          placeholder='Search packages...'
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
                          carePackages.length > 0 && ( // Show loading indicator over existing data
                            <TableRow>
                              <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                Updating data...
                              </TableCell>
                            </TableRow>
                          )}
                        {!isLoading && carePackages.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              No care packages found.
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading &&
                          carePackages.map((pkg) => {
                            const purchaseData = getPurchaseCountForPackage(pkg.id);

                            return (
                              <TableRow key={pkg.id}>
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
                                            <DropdownMenuItem onClick={() => handleView(pkg.id)}>
                                              <Eye className='mr-2 h-4 w-4' />
                                              View
                                            </DropdownMenuItem>
                                            {canEdit && (
                                              <DropdownMenuItem onClick={() => handleEdit(pkg.id)}>
                                                <Edit className='mr-2 h-4 w-4' />
                                                Edit
                                              </DropdownMenuItem>
                                            )}
                                            {canDelete && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() => handleDelete(pkg.id)}
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
                                  if (header.key === 'care_package_price') {
                                    return (
                                      <TableCell key={header.key}>
                                        ${pkg[header.key] != null ? parseFloat(pkg[header.key]).toFixed(2) : '0.00'}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'care_package_status') {
                                    // matches the key in tableHeaders
                                    return <TableCell key={header.key}>{getStatusNameById(pkg.status_id)}</TableCell>;
                                  }
                                  if (header.key === 'purchase_count') {
                                    return (
                                      <TableCell key={header.key}>
                                        {isPurchaseCountLoading ? (
                                          <span className='text-muted-foreground'>Loading...</span>
                                        ) : (
                                          <span>{purchaseData.purchase_count}</span>
                                        )}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'updated_at' || header.key === 'created_at') {
                                    return (
                                      <TableCell key={header.key}>
                                        {new Date(pkg[header.key]).toLocaleString()}
                                      </TableCell>
                                    );
                                  }
                                  return <TableCell key={header.key}>{pkg[header.key] || 'N/A'}</TableCell>;
                                })}
                              </TableRow>
                            );
                          })}
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

export default ManageCarePackagesPage;
