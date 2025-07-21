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
  Coffee,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  AlertCircle,
  Package,
  Loader2,
} from 'lucide-react';
import { useMemberCarePackageStore } from '@/stores/MemberCarePackage/useMcpPaginationStore';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ManageMemberCarePackageForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { voidMemberCarePackage } = useMcpFormStore();

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
    fetchMemberCarePackages,
  } = useMemberCarePackageStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);
  const [targetPageInput, setTargetPageInput] = useState('');
  const [actioningPackages, setActioningPackages] = useState(new Set());
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // initialize with a default limit and empty search term if not already set
    initializePagination(currentLimit || 10, searchTerm || '');
  }, [initializePagination, currentLimit, searchTerm]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearchTerm);
    goToPage(1);
  };

  const handleLimitChange = (value) => {
    const newLimit = parseInt(value, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setLimit(newLimit);
      goToPage(1);
    }
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!isNaN(pageNum) && pageNum > 0 && totalCount && pageNum <= Math.ceil(totalCount / currentLimit)) {
      goToPage(pageNum);
      setTargetPageInput('');
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
    const maxPagesToShow = 5;
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

  // --- action handlers ---
  const handleView = (pkg) => {
    navigate(`/mcp/${pkg.mcp_id}`);
  };

  const handleConsume = (pkg) => {
    navigate(`/mcp/${pkg.mcp_id}/consume`);
  };

  const handleVoid = async (pkg) => {
    const packageId = pkg.mcp_id;
    setActioningPackages((prev) => new Set(prev).add(packageId));

    try {
      await voidMemberCarePackage(packageId);
      await fetchMemberCarePackages();
      setNotification({
        type: 'success',
        message: `Package "${pkg.package_name}" has been voided successfully.`,
      });
    } catch (err) {
      console.error(`Failed to void package:`, err);
      setNotification({ type: 'error', message: `Failed to void package: ${err.message}` });
    } finally {
      setActioningPackages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  //  helper functions for package status and actions
  const getPackageStatus = (pkg) => {
    const statusName = pkg.status?.toUpperCase();
    switch (statusName) {
      case 'ENABLED':
        return { label: 'ENABLED', color: 'bg-slate-100 text-slate-700' };
      case 'DISABLED':
        return { label: 'Disabled', color: 'bg-gray-200 text-gray-600' };
      case 'REFUNDED':
        return { label: 'Refunded', color: 'bg-gray-200 text-gray-600' };
      default:
        return { label: pkg.status_name || 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const canConsumePackage = (pkg) => {
    return pkg.status?.toUpperCase() === 'ENABLED' && pkg.balance > 0;
  };

  const canVoidPackage = (pkg) => {
    return pkg.status?.toUpperCase() === 'ENABLED';
  };

  // role-based access control
  const canPerformActions = user?.role === 'super_admin' || user?.role === 'data_admin' || user?.role === 'staff';

  // calculate total services quantity for display
  const getTotalServicesQuantity = (pkg) => {
    if (!pkg.package_details || !Array.isArray(pkg.package_details)) return 0;
    return pkg.package_details.reduce((total, detail) => total + (detail.quantity || 0), 0);
  };

  // table headers - matching the actual API response structure
  const tableHeaders = [
    { key: 'mcp_id', label: 'ID' },
    { key: 'package_name', label: 'Package Name' },
    { key: 'member_name', label: 'Member' },
    { key: 'total_price', label: 'Total Price' },
    { key: 'balance', label: 'Balance' },
    { key: 'services_count', label: 'Services' },
    { key: 'status_name', label: 'Status' },
    { key: 'created_at', label: 'Purchase Date' },
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
              {notification && (
                <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{notification.message}</AlertDescription>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Member Care Package Management
                  </CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    Manage and track member care package consumption and status
                  </p>
                </CardHeader>
                <CardContent>
                  {/* search and filter controls */}
                  <div className='flex flex-col sm:flex-row gap-4 mb-6'>
                    <form onSubmit={handleSearchSubmit} className='flex gap-2 flex-1'>
                      <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                        <Input
                          placeholder='Search by package name, member name, or ID...'
                          value={inputSearchTerm}
                          onChange={(e) => setInputSearchTerm(e.target.value)}
                          className='pl-10'
                        />
                      </div>
                      <Button type='submit' disabled={isLoading}>
                        <Filter className='h-4 w-4 mr-2' />
                        Search
                      </Button>
                    </form>
                    <div className='flex gap-2'>
                      <Select value={currentLimit.toString()} onValueChange={handleLimitChange}>
                        <SelectTrigger className='w-20'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='5'>5</SelectItem>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='25'>25</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* data table */}
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
                        {isLoading && carePackages.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              Updating data...
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading && carePackages.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              No member care packages found.
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading &&
                          carePackages.map((pkg) => {
                            const statusInfo = getPackageStatus(pkg);
                            const isActioning = actioningPackages.has(pkg.mcp_id);
                            const servicesCount = getTotalServicesQuantity(pkg);

                            return (
                              <TableRow key={pkg.mcp_id}>
                                {tableHeaders.map((header) => {
                                  if (header.key === 'actions') {
                                    return (
                                      <TableCell key={header.key} className='text-right'>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' className='h-8 w-8 p-0' disabled={isActioning}>
                                              <span className='sr-only'>Open menu</span>
                                              {isActioning ? (
                                                <Loader2 className='h-4 w-4 animate-spin' />
                                              ) : (
                                                <MoreHorizontal className='h-4 w-4' />
                                              )}
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align='end'>
                                            <DropdownMenuItem onClick={() => handleView(pkg)}>
                                              <Eye className='mr-2 h-4 w-4' />
                                              View Details
                                            </DropdownMenuItem>
                                            {canPerformActions && canConsumePackage(pkg) && (
                                              <DropdownMenuItem onClick={() => handleConsume(pkg)}>
                                                <Coffee className='mr-2 h-4 w-4' />
                                                Consume
                                              </DropdownMenuItem>
                                            )}
                                            {canPerformActions && canVoidPackage(pkg) && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() => handleVoid(pkg)}
                                                  className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                                >
                                                  <XCircle className='mr-2 h-4 w-4' />
                                                  Void Package
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'total_price') {
                                    return (
                                      <TableCell key={header.key}>
                                        ${pkg[header.key] ? Number(pkg[header.key]).toFixed(2) : '0.00'}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'balance') {
                                    return (
                                      <TableCell key={header.key}>
                                        ${pkg.balance ? Number(pkg.balance).toFixed(2) : '0.00'}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'status_name') {
                                    return (
                                      <TableCell key={header.key}>
                                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'services_count') {
                                    return (
                                      <TableCell key={header.key}>
                                        {servicesCount} {servicesCount === 1 ? 'service' : 'services'}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'created_at') {
                                    return (
                                      <TableCell key={header.key}>
                                        {pkg[header.key] ? new Date(pkg[header.key]).toLocaleDateString() : 'N/A'}
                                      </TableCell>
                                    );
                                  }
                                  if (header.key === 'mcp_id') {
                                    return <TableCell key={header.key}>{pkg[header.key] || 'N/A'}</TableCell>;
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
                  {/* pagination controls */}
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
                        <Label htmlFor='page-input' className='text-sm whitespace-nowrap'>
                          Go to page:
                        </Label>
                        <Input
                          id='page-input'
                          type='number'
                          min='1'
                          max={totalPages}
                          value={targetPageInput}
                          onChange={(e) => setTargetPageInput(e.target.value)}
                          className='w-16 h-8'
                          placeholder='#'
                        />
                        <Button type='submit' size='sm' variant='outline'>
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

export default ManageMemberCarePackageForm;
