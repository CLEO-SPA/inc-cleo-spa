import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useRefundStore from '@/stores/useRefundStore';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

const CreditNotesPage = () => {
    const navigate = useNavigate();
    const {
        fetchCreditNotes,
        creditNotes,
        creditNotesTotal,
        isLoading,
        error,
        clearCreditNotes,
    } = useRefundStore();

    const [activeTab, setActiveTab] = useState('mcp');
    const [searchMember, setSearchMember] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchData();
        return () => clearCreditNotes();
    }, [page, activeTab]);

    const fetchData = () => {
        fetchCreditNotes({
            member: searchMember.trim() || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            pageSize,
            type: activeTab,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const totalPages = Math.ceil(creditNotesTotal / pageSize);

    const tabs = [
        { key: 'mcp', label: 'Member Care Package' },
        { key: 'mv', label: 'Member Voucher' },
        { key: 'service', label: 'Service' },
    ];

    // Map refund types to display names
    const getRefundTypeDisplay = (type) => {
        switch (type) {
            case 'mcp': return 'Member Care Package';
            case 'mv': return 'Member Voucher';
            case 'service': return 'Service';
            default: return type;
        }
    };

    // Truncate long text with tooltip option
    const truncateText = (text, maxLength = 50) => {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='flex flex-1 flex-col gap-4 p-4'>
                            <div className='max-w-7xl mx-auto w-full'>
                                <h1 className='text-2xl font-bold mb-6 text-gray-800'>Credit Notes</h1>

                                {/* Tabs */}
                                <div className="mb-4 flex gap-2 border-b border-gray-300">
                                    {tabs.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setActiveTab(key);
                                                setPage(1);
                                            }}
                                            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-150 ${activeTab === key
                                                ? 'border-gray-800 text-gray-800'
                                                : 'border-transparent text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Filters */}
                                <form onSubmit={handleSearch} className='mb-6 flex gap-2 flex-wrap'>
                                    <input
                                        type='text'
                                        placeholder='Search by member name'
                                        value={searchMember}
                                        onChange={e => setSearchMember(e.target.value)}
                                        className='border border-gray-300 p-2 rounded-md flex-grow min-w-[200px] focus:outline-none focus:ring-2 focus:ring-gray-500'
                                    />
                                    <input
                                        type='date'
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className='border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500'
                                        max={endDate || undefined}
                                    />
                                    <input
                                        type='date'
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className='border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500'
                                        min={startDate || undefined}
                                    />
                                    <button
                                        type='submit'
                                        className='px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                                    >
                                        Search
                                    </button>
                                </form>

                                {/* Status messages */}
                                {isLoading && (
                                    <div className="py-16 flex flex-col items-center justify-center text-gray-500">
                                        <svg
                                            className="animate-spin h-8 w-8 mb-3 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <p className="text-lg font-medium">Loading refund records...</p>
                                    </div>
                                )}

                                {error && <p className='text-red-600 bg-red-50 p-3 rounded-md border border-red-200'>{error}</p>}
                                {!isLoading && creditNotes.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-12 w-12 mb-4 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h6v6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h4a2 2 0 012 2v12a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-semibold">No refund records found</p>
                                    </div>
                                )}

                                {/* Table Container with Horizontal Scroll */}
                                {!isLoading && creditNotes.length > 0 && (
                                    <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                                        <Table className="min-w-full">
                                            <TableHeader>
                                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">ID</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">Member</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">Type</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">Item Name</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">Total Amount</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3">Date</TableHead>
                                                    <TableHead className="border-b border-gray-300 font-semibold text-gray-700 px-4 py-3 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {creditNotes.map((note, index) => (
                                                    <TableRow
                                                        key={note.id}
                                                        className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                                                    >
                                                        <TableCell className="border-b border-gray-200 px-4 py-3 font-medium">{note.id}</TableCell>
                                                        <TableCell className="border-b border-gray-200 px-4 py-3">
                                                            <div className="max-w-[150px]">
                                                                <div className="font-medium text-gray-900">
                                                                    {truncateText(note.member_name || 'N/A', 20)}
                                                                </div>
                                                                {note.member_id && (
                                                                    <div className="text-sm text-gray-500">
                                                                        ID: {note.member_id}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="border-b border-gray-200 px-4 py-3">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {getRefundTypeDisplay(note.refund_type)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="border-b border-gray-200 px-4 py-3">
                                                            <div className="max-w-[200px]">
                                                                <div className="font-medium text-gray-900">
                                                                    {truncateText(note.item_name || 'N/A', 25)}
                                                                </div>
                                                                {/*
                                                                {note.item_type && (
                                                                    <div className="text-xs text-gray-500 capitalize">
                                                                        {note.item_type}
                                                                    </div>
                                                                )}
                                                                */}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="border-b border-gray-200 px-4 py-3 text-rose-500 font-semibold">
                                                            ${Math.abs(Number(note.total_paid_amount)).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
                                                            {note.created_at ?
                                                                new Date(note.created_at).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) :
                                                                'N/A'
                                                            }
                                                        </TableCell>
                                                        {/*
                                                        <TableCell className="border-b border-gray-200 px-4 py-3 max-w-xs">
                                                            <div
                                                                className="text-sm text-gray-600 break-words"
                                                                title={note.remarks || 'N/A'}
                                                            >
                                                                {truncateText(note.remarks)}
                                                            </div>
                                                        </TableCell>
                                                         */}
                                                        <TableCell className="border-b border-gray-200 px-4 py-3 text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/credit-notes/${note.id}`)}
                                                                className="hover:bg-gray-50"
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" /> View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className='flex justify-center mt-6 space-x-2'>
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                            className='px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                                        >
                                            Previous
                                        </button>
                                        <span className='px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium'>
                                            {page} of {totalPages}
                                        </span>
                                        <button
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                            className='px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default CreditNotesPage;