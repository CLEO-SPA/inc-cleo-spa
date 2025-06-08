import React, { useState, useEffect, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';


const MemberVoucherTransactionLogs = () => {
    const { user } = useAuth();
    const {
        memberVoucherTransactionLogs,
        currentPage,
        currentLimit,
        hasNextPage,
        hasPreviousPage,
        totalCount,
        loading,
        goToNextPage,
        goToPreviousPage,
        goToPage,
        setLimit,
    } = useMemberVoucherTransactionStore();

    const [targetPageInput, setTargetPageInput] = useState('');
    // const [showConfirm, setShowConfirm] = useState(false);
    // const [formValues, setFormValues] = useState({});

    // const handleDelete = async (data) => {
    //     console.log("Delete Data: " + data);

    //     if (!data) {
    //         throw new Error("The membership type has no id");
    //     }

    //     setFormValues(data);
    //     setShowConfirm(true);
    // };

    // const confirmBody = (
    //     <div>
    //         {Object.entries(formValues).map(([key, value]) => (
    //             <div key={key} className="flex justify-between border-b py-1">
    //                 <span className="font-medium">{key}</span>
    //                 <span>
    //                     {value instanceof Date
    //                         ? value.toLocaleString()
    //                         : value?.toString() ?? ''}</span>
    //             </div>
    //         ))}
    //     </div>
    // );

    const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';
    const canDelete = user?.role === 'super_admin';

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

    const tableHeaders = [
        { key: 'id', label: 'ID' },
        { key: 'amount_change', label: 'Consumption Value' },
        { key: 'service_description', label: 'Remarks' },
        { key: 'current_balance', label: 'Current Balance' },
        { key: 'service_date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'created_by', label: 'Created By' },
        { key: 'last_updated_by', label: 'Last Updated By' },
        { key: 'actions', label: 'Actions' }
    ];

    return (
        <Card className="mx-5">
            <CardHeader>
                <CardTitle>Voucher Management</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
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
                            {loading &&
                                memberVoucherTransactionLogs.length > 0 && ( // Show loading indicator over existing data
                                    <TableRow>
                                        <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                            Updating data...
                                        </TableCell>
                                    </TableRow>
                                )}
                            {!loading && memberVoucherTransactionLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                        No Transaction Logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading &&
                                memberVoucherTransactionLogs.map((transaction, index) => (
                                    <TableRow key={transaction.id}>
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
                                                                {canEdit && (
                                                                    <DropdownMenuItem onClick={() => {
                                                                        // setIsUpdating(true);
                                                                    }}>
                                                                        <Edit className='mr-2 h-4 w-4' />
                                                                        Update
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canDelete && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                // const id = voucher.id
                                                                                // // const value = getMembershipTypeById(id);

                                                                                // // if (setSelectedMembershipTypeId(id)) {
                                                                                // //     handleDelete(value);
                                                                                // // };
                                                                            }}
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
                                            if (header.key === 'service_date') {
                                                return <TableCell key={header.key}>{new Date(transaction[header.key]).toUTCString()}</TableCell>;
                                            }
                                            if (header.key === 'id') {
                                                const rowNumber = (currentPage - 1) * currentLimit + index + 1;
                                                return <TableCell key={header.key}>{rowNumber}</TableCell>;
                                            }
                                            return <TableCell key={header.key}>{transaction[header.key] ?? 'N/A'}</TableCell>;
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
                                disabled={!hasPreviousPage || loading}
                            >
                                <ChevronsLeft className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={goToPreviousPage}
                                disabled={!hasPreviousPage || loading}
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
                                    disabled={loading}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button variant='outline' size='sm' onClick={goToNextPage} disabled={!hasNextPage || loading}>
                                Next
                                <ChevronRight className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => goToPage(totalPages)}
                                disabled={!hasNextPage || loading}
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
                                disabled={loading}
                            />
                            <Button type='submit' variant='outline' size='sm' disabled={loading}>
                                Go
                            </Button>
                        </form>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
};

export default MemberVoucherTransactionLogs;