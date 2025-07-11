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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Copy,
  LinkIcon,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useUsersStore from '@/stores/users/useUsersStore';

function ManageUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    users,
    currentPage,
    currentLimit,
    hasNextPage,
    hasPreviousPage,
    searchTerm,
    totalCount,
    totalPages,
    isLoading,
    error,
    actioningUsers,
    inviteDialogOpen,
    selectedUser,
    invitationLink,
    isGeneratingLink,
    initializePagination,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    setSearchTerm,
    setLimit,
    fetchUsers,
    deleteUser,
    openInviteDialog,
    closeInviteDialog,
    regenerateInvitationLink,
    clearError,
  } = useUsersStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);
  const [targetPageInput, setTargetPageInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Check if user has appropriate role
  const canCreate = user?.role === 'super_admin';
  const canEdit = user?.role === 'super_admin';
  const canDelete = user?.role === 'super_admin';

  // Initialize pagination on component mount
  useEffect(() => {
    initializePagination(currentLimit, searchTerm);
    return () => clearError();
  }, [initializePagination, currentLimit, searchTerm, clearError]);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearchTerm);
  };

  // Handle limit change
  const handleLimitChange = (value) => {
    setLimit(parseInt(value));
  };

  // Handle going to a specific page
  const handleGoToPage = (e) => {
    e.preventDefault();
    const page = parseInt(targetPageInput);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
      setTargetPageInput('');
    }
  };

  // Navigation functions
  const handleView = (userId) => {
    navigate(`/users/${userId}`);
  };

  const handleEdit = (userId) => {
    navigate(`/users/${userId}/edit`);
  };

  // Delete functions
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Invitation link functions
  const handleRegenerateInvite = async (user) => {
    openInviteDialog(user);
    try {
      await regenerateInvitationLink(user.email);
    } catch (error) {
      console.error('Failed to regenerate invitation link:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
  };

  // Calculate pagination range
  const pageNumbers = useMemo(() => {
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

  // Table headers
  const tableHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role_name', label: 'Role' },
    { key: 'actions', label: 'Actions' },
  ];

  // Loading state
  if (isLoading && (!users || !Array.isArray(users) || users.length === 0)) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex h-full items-center justify-center'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='text-2xl font-semibold'>Loading...</div>
                  <div className='text-muted-foreground'>Please wait while we fetch user data.</div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // Error state
  if (error && (!users || !Array.isArray(users) || users.length === 0)) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex h-full items-center justify-center'>
                <div className='flex flex-col items-center gap-2'>
                  <AlertCircle className='h-10 w-10 text-destructive' />
                  <div className='text-2xl font-semibold'>Error Loading Users</div>
                  <div className='text-muted-foreground'>{error}</div>
                  <Button onClick={() => initializePagination(currentLimit, searchTerm)}>Retry</Button>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
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
                  <CardTitle>User Management</CardTitle>
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
                          placeholder='Search users...'
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
                    {canCreate && (
                      <Button onClick={() => navigate('/users/create')} className='ml-auto'>
                        <UserPlus className='w-4 h-4 mr-2' />
                        Create User
                      </Button>
                    )}
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
                        {isLoading && Array.isArray(users) && users.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              Updating data...
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading && (!Array.isArray(users) || users.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading &&
                          Array.isArray(users) &&
                          users.map((user) => {
                            const isActioning = actioningUsers.has(user.id);

                            return (
                              <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{user.username || 'N/A'}</TableCell>
                                <TableCell>{user.email || 'N/A'}</TableCell>
                                <TableCell>{user.role_name || 'N/A'}</TableCell>
                                <TableCell className='text-right'>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant='ghost' className='h-8 w-8 p-0' disabled={isActioning}>
                                        <span className='sr-only'>Open menu</span>
                                        <MoreHorizontal className='h-4 w-4' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem onClick={() => handleView(user.id)}>
                                        <Eye className='mr-2 h-4 w-4' />
                                        View
                                      </DropdownMenuItem>
                                      {canEdit && (
                                        <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                                          <Edit className='mr-2 h-4 w-4' />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => handleRegenerateInvite(user)}>
                                        <RefreshCw className='mr-2 h-4 w-4' />
                                        Regenerate Invite
                                      </DropdownMenuItem>
                                      {canDelete && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteClick(user)}
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

              {/* Delete confirmation dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={handleDeleteConfirm}
                      disabled={actioningUsers.has(userToDelete?.id)}
                    >
                      {actioningUsers.has(userToDelete?.id) ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Invitation link dialog */}
              <Dialog open={inviteDialogOpen} onOpenChange={closeInviteDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitation Link</DialogTitle>
                    <DialogDescription>
                      {isGeneratingLink ? (
                        'Generating invitation link...'
                      ) : (
                        <>
                          Invitation link for <strong>{selectedUser?.email}</strong>. Share this link with the user to
                          complete their registration.
                        </>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  {invitationLink && (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 p-2 bg-muted rounded-md'>
                        <LinkIcon className='h-4 w-4 text-muted-foreground' />
                        <div className='text-sm flex-1 overflow-x-auto whitespace-nowrap'>{invitationLink}</div>
                        <Button variant='outline' size='sm' onClick={handleCopyLink} className='flex-shrink-0'>
                          <Copy className='h-4 w-4 mr-2' />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant='outline' onClick={closeInviteDialog}>
                      Close
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

export default ManageUsersPage;
