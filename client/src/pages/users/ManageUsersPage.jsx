import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MoreHorizontal, Eye, Edit, Trash2, RefreshCw, Plus, Search,
} from 'lucide-react';

import useAuth from '@/hooks/useAuth';
import useUsersStore from '@/stores/users/useUsersStore';

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    users,
    currentPage,
    currentLimit,
    hasNextPage,
    hasPreviousPage,
    totalCount,
    totalPages,
    searchTerm,
    isLoading,
    error,
    selectedUser,
    actioningUsers,
    isGeneratingLink,
    inviteDialogOpen,
    initializePagination,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setSearchTerm,
    setLimit,
    openInviteDialog,
    closeInviteDialog,
    regenerateInvitationLink,
    deleteUser,
    clearError,
  } = useUsersStore();

  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);

  const canCreate = user?.role === 'super_admin';
  const canEdit = user?.role === 'super_admin';
  const canDelete = user?.role === 'super_admin';

  useEffect(() => {
    initializePagination(currentLimit, searchTerm);
    return () => clearError();
  }, [initializePagination, currentLimit, searchTerm, clearError]);

  const handleSearch = () => {
    setSearchTerm(inputSearchTerm);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4'>
              <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Manage Users</h1>
                {canCreate && (
                  <Button onClick={() => navigate('/users/create')}>
                    <Plus className='mr-2 h-4 w-4' /> Add User
                  </Button>
                )}
              </div>

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardContent className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm'>Show:</span>
                    <select
                      value={currentLimit}
                      onChange={(e) => setLimit(parseInt(e.target.value))}
                      className='border rounded px-2 py-1 text-sm'
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className='flex items-center gap-2 w-full sm:w-1/3'>
                    <Input
                      value={inputSearchTerm}
                      onChange={(e) => setInputSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder='Search by username or email'
                      className='h-9 text-sm'
                    />
                    <Button onClick={handleSearch} size='sm' className='h-9 px-3'>
                      <Search className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className='mb-2 text-sm text-muted-foreground'>
                    Showing {(currentPage - 1) * currentLimit + 1}–
                    {Math.min(currentPage * currentLimit, totalCount)} of {totalCount} users
                  </div>

                  {isLoading ? (
                    <div className='flex justify-center py-8'>
                      <span className='text-sm text-muted-foreground'>Loading...</span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className='text-center text-sm text-muted-foreground py-6'>No users found.</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className='text-center'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u, index) => (
                            <TableRow key={u.id}>
                              <TableCell>{(currentPage - 1) * currentLimit + index + 1}</TableCell>
                              <TableCell>{u.username}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                {u.status_name === 'VERIFIED' ? (
                                  <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'>
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800'>
                                    {u.status_name}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{u.role_name}</TableCell>
                              <TableCell className='text-right'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' size='icon' className='w-8 h-8'>
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuItem onClick={() => navigate(`/users/${u.id}`)}>
                                      <Eye className='mr-2 h-4 w-4' /> View
                                    </DropdownMenuItem>
                                    {canEdit && (
                                      <DropdownMenuItem onClick={() => navigate(`/users/${u.id}/edit`)}>
                                        <Edit className='mr-2 h-4 w-4' /> Edit
                                      </DropdownMenuItem>
                                    )}
                                    {u.status_name !== 'VERIFIED' && (
                                      <DropdownMenuItem onClick={() => regenerateInvitationLink(u.email)}>
                                        <RefreshCw className='mr-2 h-4 w-4' /> Regenerate Invite
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => deleteUser(u.id)}
                                          className='text-destructive focus:bg-red-100'
                                        >
                                          <Trash2 className='mr-2 h-4 w-4' /> Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <Pagination className='mt-4'>
                        <PaginationContent>
                          {currentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious onClick={() => goToPreviousPage()} />
                            </PaginationItem>
                          )}
                          {pageNumbers.map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          {currentPage < totalPages && (
                            <PaginationItem>
                              <PaginationNext onClick={() => goToNextPage()} />
                            </PaginationItem>
                          )}
                        </PaginationContent>
                      </Pagination>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
