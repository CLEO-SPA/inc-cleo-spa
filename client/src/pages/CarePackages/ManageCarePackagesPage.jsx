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
  AlertTriangle,
} from 'lucide-react';
import { useCpPaginationStore } from '@/stores/CarePackage/useCpPaginationStore';
import { useCpSpecificStore } from '@/stores/CarePackage/useCpSpecificStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

function ManageCarePackagesPage() {
  const { user } = useAuth();
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
  const { updatePackageStatus, deletePackage } = useCpSpecificStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);
  const [targetPageInput, setTargetPageInput] = useState('');
  const [updatingPackages, setUpdatingPackages] = useState(new Set());
  const [deletingPackages, setDeletingPackages] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

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
    navigate(`/cp/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/cp/${id}/edit`);
  };

  // helper functions to determine if a package is enabled based on status
  const isPackageEnabled = (pkg) => {
    return pkg.status === 'ENABLED';
  };

  const getStatusIdForToggle = (enabled) => {
    return enabled ? 'ENABLED' : 'DISABLED';
  };

  const handleToggleStatus = async (pkg, newEnabledState) => {
    const packageId = pkg.id;
    setUpdatingPackages((prev) => new Set(prev).add(packageId));

    try {
      const newStatus = getStatusIdForToggle(newEnabledState);
      await updatePackageStatus(packageId, newStatus);

      // refresh both the care packages list AND the purchase count data
      await Promise.all([initializePagination(currentLimit, searchTerm), fetchPurchaseCount()]);
    } catch (err) {
      console.error('Failed to update package status:', err);
      alert(`Failed to ${newEnabledState ? 'enable' : 'disable'} package: ${err.message}`);

      // even if status update fails, try to refresh data to show current state
      try {
        await Promise.all([initializePagination(currentLimit, searchTerm), fetchPurchaseCount()]);
      } catch (refreshErr) {
        console.error('Failed to refresh data after error:', refreshErr);
      }
    } finally {
      setUpdatingPackages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  // open delete confirmation dialog
  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  // handle actual deletion
  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    const packageId = packageToDelete.id;
    setDeletingPackages((prev) => new Set(prev).add(packageId));

    try {
      await deletePackage(packageId);
      initializePagination(currentLimit, searchTerm);
      fetchPurchaseCount();

      // close dialog and reset state
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    } catch (err) {
      console.error('Failed to delete care package:', err);

      // show error message
      let errorMessage = 'Failed to delete care package.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(errorMessage);
    } finally {
      setDeletingPackages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  // cancel deletion
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  // enhanced check if package can be safely deleted (both purchase count AND status)
  const canDeletePackage = (pkg) => {
    const purchaseData = getPurchaseCountForPackage(pkg.id);
    const hasNoPurchases = purchaseData.purchase_count === 0 && purchaseData.is_purchased === 'No';
    const isDisabled = !isPackageEnabled(pkg);

    return hasNoPurchases && isDisabled;
  };

  // enhanced deletion restriction reason that includes both purchase count AND status
  const getDeleteRestrictionReason = (pkg) => {
    const purchaseData = getPurchaseCountForPackage(pkg.id);
    const hasNoPurchases = purchaseData.purchase_count === 0 && purchaseData.is_purchased === 'No';
    const isEnabled = isPackageEnabled(pkg);
    const reasons = [];

    // check purchase count first
    if (purchaseData.purchase_count > 0) {
      reasons.push(
        `This package has ${purchaseData.purchase_count} existing purchase${purchaseData.purchase_count > 1 ? 's' : ''}`
      );
    }

    // check status
    if (isEnabled) {
      reasons.push('This package is currently enabled');
    }

    if (reasons.length === 0) {
      return null;
    }

    let message = reasons.join(' and ') + ' and cannot be deleted.';
    if (isEnabled && hasNoPurchases) {
      message += ' Please disable the package first by changing its status to "Inactive" before attempting deletion.';
    } else if (isEnabled && !hasNoPurchases) {
      message += ' You can disable it to prevent new purchases, but it cannot be deleted due to existing purchases.';
    } else if (!isEnabled && !hasNoPurchases) {
      message +=
        ' You can keep it disabled to prevent new purchases, but it cannot be deleted due to existing purchases.';
    }

    return message;
  };

  // --- Role-based access ---
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
  const canDelete = user?.role === 'super_admin';
  const canToggleStatus = user?.role === 'super_admin' || user?.role === 'data_admin';

  // --- Table Headers ---
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
                            const isEnabled = isPackageEnabled(pkg);
                            const isUpdatingThis = updatingPackages.has(pkg.id);
                            const isDeletingThis = deletingPackages.has(pkg.id);
                            const isDeletable = canDeletePackage(pkg);

                            return (
                              <TableRow key={pkg.id}>
                                {tableHeaders.map((header) => {
                                  if (header.key === 'actions') {
                                    return (
                                      <TableCell key={header.key} className='text-right'>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' className='h-8 w-8 p-0' disabled={isDeletingThis}>
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
                                                  onClick={() => handleDeleteClick(pkg)}
                                                  disabled={!isDeletable || isDeletingThis}
                                                  className={`${
                                                    isDeletable && !isDeletingThis
                                                      ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                                                      : 'text-muted-foreground cursor-not-allowed'
                                                  }`}
                                                  title={
                                                    !isDeletable
                                                      ? isEnabled
                                                        ? 'Package must be disabled and have no purchases to delete'
                                                        : 'Package has existing purchases and cannot be deleted'
                                                      : 'Delete package'
                                                  }
                                                >
                                                  <Trash2 className='mr-2 h-4 w-4' />
                                                  {isDeletingThis ? 'Deleting...' : 'Delete'}
                                                  {!isDeletable && !isDeletingThis && (
                                                    <AlertTriangle className='ml-2 h-3 w-3' />
                                                  )}
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
                                  // matches the key in tableHeaders
                                  if (header.key === 'care_package_status') {
                                    return (
                                      <TableCell key={header.key}>
                                        <div className='flex flex-col gap-2'>
                                          {/* Toggle switch under status */}
                                          <div className='flex items-center gap-2'>
                                            {canToggleStatus ? (
                                              <button
                                                onClick={() => handleToggleStatus(pkg, !isEnabled)}
                                                disabled={isUpdatingThis}
                                                className={`
                                                  relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                                                  ${
                                                    isEnabled
                                                      ? 'bg-gray-700 dark:bg-gray-100'
                                                      : 'bg-gray-300 dark:bg-gray-600'
                                                  }
                                                  ${isUpdatingThis ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                                `}
                                              >
                                                <span
                                                  className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                    ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}
                                                  `}
                                                />
                                              </button>
                                            ) : (
                                              <button
                                                disabled={true}
                                                className={`
                                                  relative inline-flex h-5 w-9 items-center rounded-full
                                                  ${
                                                    isEnabled
                                                      ? 'bg-gray-700 dark:bg-gray-100'
                                                      : 'bg-gray-300 dark:bg-gray-600'
                                                  }
                                                  opacity-50 cursor-not-allowed
                                                `}
                                              >
                                                <span
                                                  className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                    ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}
                                                  `}
                                                />
                                              </button>
                                            )}
                                            <div className='flex items-center gap-1'>
                                              <span className='text-xs text-muted-foreground'>
                                                {isUpdatingThis ? 'Updating...' : isEnabled ? 'ENABLED' : 'DISABLED'}
                                              </span>
                                              {isEnabled && canDelete && purchaseData.purchase_count === 0 && (
                                                <div className='group relative'>
                                                  <AlertTriangle className='h-3 w-3 text-amber-500' />
                                                  <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                                                    Disable to allow deletion
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'purchase_count') {
                                    return (
                                      <TableCell key={header.key}>
                                        {isPurchaseCountLoading ? (
                                          <span className='text-muted-foreground'>Loading...</span>
                                        ) : purchaseCountError ? (
                                          <div className='flex items-center gap-2'>
                                            <span className='text-red-500 text-xs'>Error</span>
                                            <AlertTriangle
                                              className='h-3 w-3 text-red-500'
                                              title={`Failed to load purchase count: ${purchaseCountError}`}
                                            />
                                          </div>
                                        ) : (
                                          <div className='flex items-center gap-2'>
                                            <span>{purchaseData.purchase_count}</span>
                                            {purchaseData.purchase_count > 0 && (
                                              <div className='group relative'>
                                                <AlertTriangle className='h-3 w-3 text-amber-500' />
                                                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                                                  Package has existing purchases and cannot be deleted
                                                </div>
                                              </div>
                                            )}
                                          </div>
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

              {/* delete confirmation dialog */}
              {packageToDelete && (
                <DeleteConfirmationDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                  onConfirm={handleDeleteConfirm}
                  onCancel={handleDeleteCancel}
                  title='Delete Care Package'
                  itemName={packageToDelete.care_package_name}
                  itemType='care package'
                  isDeleting={deletingPackages.has(packageToDelete.id)}
                  canDelete={canDeletePackage(packageToDelete)}
                  deleteRestrictionReason={getDeleteRestrictionReason(packageToDelete)}
                  destructiveAction={true}
                  itemDetails={
                    <div>
                      <div>
                        <strong>Package ID:</strong> {packageToDelete.id}
                      </div>
                      <div>
                        <strong>Price:</strong> ${parseFloat(packageToDelete.care_package_price || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Status:</strong> {packageToDelete.status || 'Unknown'}
                      </div>
                      <div>
                        <strong>Purchase Count:</strong> {getPurchaseCountForPackage(packageToDelete.id).purchase_count}
                      </div>
                    </div>
                  }
                />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default ManageCarePackagesPage;
