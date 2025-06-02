import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus,
 } from 'lucide-react';
import DateRangePicker from '@/components/date-range-picker';
import { format } from 'date-fns';

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
import useMemberStore from '@/stores/useMemberStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

function ManageMembersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
const {
  members,
  currentPage,
  currentLimit,
  totalPages,
  totalCount,
  searchTerm,
  createdBy,
  startDate_utc,
  endDate_utc,
  isFetching,
  isDeleting,
  error,
  errorMessage,
  fetchMembers,
  deleteMember,
  setSelectedMemberId,
  goToPage,
  goToNextPage,
  goToPreviousPage,
  setLimit,
  setDateRange,
  setCreatedBy,
  setSearchTerm,
} = useMemberStore();


  // Local state for form inputs only
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  const [inputCreatedBy, setInputCreatedBy] = useState('');
  const [createdDateRange, setCreatedDateRange] = useState({
    from: undefined, // or new Date(existingStartDate) if you have initial values
    to: undefined    // or new Date(existingEndDate) if you have initial values
  });

  const [targetPageInput, setTargetPageInput] = useState('');

  // Initialize search input with store value
useEffect(() => {
  setInputSearchTerm(searchTerm || '');
  setInputCreatedBy(createdBy || '');
  setCreatedDateRange({
    from: startDate_utc ? new Date(startDate_utc) : undefined,
    to: endDate_utc ? new Date(endDate_utc) : undefined
  });
}, [searchTerm, createdBy, startDate_utc, endDate_utc]);


  // Fetch members on component mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

  const startDateString = createdDateRange.from ? format(createdDateRange.from, 'yyyy-MM-dd') : '';
  const endDateString = createdDateRange.to ? format(createdDateRange.to, 'yyyy-MM-dd') : '';
    setSearchTerm(inputSearchTerm);
    setCreatedBy(inputCreatedBy);
    setDateRange(startDateString, endDateString);
    goToPage(1);
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
    setSelectedMemberId(id);
    navigate(`/member/${id}`); // Adjust route as needed
  };

  const handleEdit = (id) => {
    setSelectedMemberId(id);
    navigate(`/member/${id}/edit`); // Adjust route as needed
  };

  
  const handleCreate = () => {
    navigate('/member/create'); // Adjust route as needed
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      const result = await deleteMember(id);
      if (result.success) {
        alert('Member deleted successfully.');
      } else {
        alert(`Failed to delete member: ${result.error}`);
      }
    }
  };

  // --- Role-based access ---
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
  const canDelete = user?.role === 'super_admin';
  const canCreate = user?.role === 'super_admin' || user?.role === 'data_admin';

  // --- Table headers for members ---
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'contact', label: 'Contact' },
    { key: 'dob', label: 'DOB' },
    { key: 'sex', label: 'Sex' },
    { key: 'membership_type_name', label: 'Membership' },
    { key: 'total_amount_owed', label: 'Owed' },
    { key: 'last_visit_date', label: 'Last Visited' },
    { key: 'created_at', label: 'Created' },
    { key: 'created_by_name', label: 'Created by' },
    { key: 'actions', label: 'Actions' },
  ];

  if (isFetching && !members.length) {
    // Show loading only if no data is present yet
    return <div className='flex justify-center items-center h-screen'>Loading members...</div>;
  }

  if (error) {
    return (
      <div className='text-red-500 text-center mt-10'>
        Error loading members: {errorMessage || 'Unknown error'}
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
                  <CardTitle>Members Management</CardTitle>
                  {totalCount > 0 && (
                    <p className='text-sm text-muted-foreground'>
                      Showing {members.length} of {totalCount} members
                    </p>
                  )}
                  </div>
                    {canCreate && (
                    <Button onClick={handleCreate} className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Add Member
                    </Button>
                  )}
                </CardHeader>
                <CardContent className='space-y-4'>
                {/* Search and Limit Controls */}
                <div className='flex flex-col sm:flex-row gap-4 items-end'>

              <form onSubmit={handleSearchSubmit} className='flex-grow sm:flex-grow-0 sm:w-5/8'>
                <div className='flex items-center gap-2'>
                  <Input
                    id='search'
                    type='text'
                    placeholder='Search by Name or Contact'
                    value={inputSearchTerm}
                    onChange={(e) => setInputSearchTerm(e.target.value)}
                    className='w-55'
                  />
                  
                  <Input
                    id="createdBy"
                    type="text"
                    placeholder="Created By"
                    value={inputCreatedBy}
                    onChange={(e) => setInputCreatedBy(e.target.value)}
                    className='w-40'
                  />
                  
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-600 whitespace-nowrap'>Created:</span>
                    <DateRangePicker
                      value={createdDateRange}
                      onValueChange={setCreatedDateRange}
                    />
                  </div>

                  
                  <Button type='submit'
                    className='w-25'
                    disabled={isFetching}>
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
                        {!isFetching && members.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              {searchTerm ? 'No members found matching your search.' : 'No members found.'}
                            </TableCell>
                          </TableRow>
                        )}
                        {!isFetching &&
                          members.map((member) => (
                            <TableRow key={member.id}>
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
                                          <DropdownMenuItem onClick={() => handleView(member.id)}>
                                            <Eye className='mr-2 h-4 w-4' />
                                            View
                                          </DropdownMenuItem>
                                          {canEdit && (
                                            <DropdownMenuItem onClick={() => handleEdit(member.id)}>
                                              <Edit className='mr-2 h-4 w-4' />
                                              Edit
                                            </DropdownMenuItem>
                                          )}
                                          {canDelete && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() => handleDelete(member.id)}
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
                                  const date = member[header.key];
                                  return (
                                    <TableCell key={header.key}>
                                      {date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'}
                                    </TableCell>
                                  );
                                }

                                if (header.key === 'total_amount_owed') {
                                  const amount = member[header.key];
                                  return (
                                    <TableCell key={header.key}>
                                      {amount != null ? `$${parseFloat(amount).toFixed(2)}` : '$0.00'}
                                    </TableCell>
                                  );
                                }

                                return <TableCell key={header.key}>{member[header.key] || 'N/A'}</TableCell>;
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

export default ManageMembersPage;