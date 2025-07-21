import React, { useState, useEffect, useCallback } from 'react';
import { Search, Home, Filter, ArrowUpDown, CreditCard, Users, DollarSign, Calendar, Eye, RefreshCcw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';


const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    loading,
    onPrevPage,
    onNextPage,
    onPageChange 
}) => (
    <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrevPage}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium 
                            hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                            const nearCurrent = Math.abs(page - currentPage) <= 1;
                            const isFirstOrLast = page === 1 || page === totalPages;
                            return nearCurrent || isFirstOrLast;
                        })
                        .map((page, index, array) => (
                            <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="px-2">...</span>
                                )}
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        ))}
                </div>
                <button
                    onClick={onNextPage}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium 
                            hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
            <div className="text-sm text-gray-500">
                Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </div>
        </div>
    </div>
);

const SaleTransactionList = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('transaction_id');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchBuffer, setSearchBuffer] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    
    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/st/list', {
                params: {
                    filter,
                    searchQuery,
                    memberSearchQuery,
                    sortField,
                    sortDirection,
                    page: currentPage,
                    limit: itemsPerPage
                }
            });
            
            if (response.data && response.data.success) {
                setTransactions(response.data.data);
                setTotalItems(response.data.pagination.total);
                setTotalPages(response.data.pagination.totalPages);
            } else {
                setError('Invalid response format');
            }
        } catch (err) {
            setError('Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery, memberSearchQuery, sortField, sortDirection, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]); 

    const handleSort = useCallback((field) => {
        setSortDirection(currentDirection => {
            if (sortField === field) {
                return currentDirection === 'asc' ? 'desc' : 'asc';
            }
            return 'desc';
        });
        setSortField(field);
        setCurrentPage(1); 
    }, [sortField]);

    const handleTextboxChange = useCallback((e) => {
        setSearchBuffer(e.target.value);
    }, []);

    const handleSearchSubmit = useCallback(() => {
        setSearchQuery(searchBuffer);
        setCurrentPage(1);
    }, [searchBuffer]);

    const handleSearchKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    const handleClearSearch = useCallback(() => {
        setSearchBuffer('');
        setSearchQuery('');
        setCurrentPage(1);
    }, []);

    const handleMemberSearchChange = useCallback((e) => {
        setMemberSearchQuery(e.target.value);
        setCurrentPage(1);
    }, []);

    const formatCurrency = useCallback((amount) => {
        const num = parseFloat(amount);
        return num.toLocaleString('en-US', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2
        });
    }, []);

    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-SG', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }).format(date);
    }, []);

    const handlePrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleView = useCallback((transactionId) => {
        navigate(`/sale-transaction/${transactionId}`);
    }, [navigate]);

    const handleRefund = useCallback((transaction) => {
        alert(`Refund for Transaction #${transaction.transaction_id} with amount ${formatCurrency(transaction.total_paid_amount)}`);
    }, [formatCurrency]);

    const handleFilterChange = useCallback((e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    }, []);

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className="max-w-[1600px] mx-auto p-4 space-y-6">
                            {/* Header Section */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold">Sale Transactions</CardTitle>
                                        <Button 
                                            onClick={fetchTransactions}
                                            variant="outline" 
                                            size="sm"
                                            className="flex items-center gap-1"
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                            <span>Refresh</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Manage and track all sale transactions</p>
                                            {filter && (
                                                <div className="mt-2 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                                    {filter === 'FULL' ? 'Showing fully paid transactions' : 
                                                     filter === 'PARTIAL' ? 'Showing partially paid transactions' :
                                                     filter === 'package' ? 'Showing package transactions' :
                                                     filter === 'service' ? 'Showing service transactions' :
                                                     filter === 'product' ? 'Showing product transactions' :
                                                     filter === 'voucher' ? 'Showing voucher transactions' : ''}
                                                </div>
                                            )}
                                            
                                            {/* Show active search indicators */}
                                            {searchQuery && (
                                                <div className="mt-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full inline-block">
                                                    Receipt: "{searchQuery}"
                                                    <button
                                                        onClick={handleClearSearch}
                                                        className="ml-1 text-green-600 hover:text-green-800"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {memberSearchQuery && (
                                                <div className="mt-2 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full inline-block">
                                                    Member: "{memberSearchQuery}"
                                                    <button
                                                        onClick={() => {setMemberSearchQuery(''); setCurrentPage(1);}}
                                                        className="ml-1 text-purple-600 hover:text-purple-800"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                                            <select
                                                value={filter}
                                                onChange={handleFilterChange}
                                                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Transactions</option>
                                                <option value="FULL">Fully Paid</option>
                                                <option value="PARTIAL">Partially Paid</option>
                                                <option value="package">Packages</option>
                                                <option value="service">Services</option>
                                                <option value="product">Products</option>
                                                <option value="voucher">Vouchers</option>
                                            </select>
                                            
                                            {/* Receipt Number Search */}
                                            <div className="relative flex items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Search by receipt number..."
                                                    value={searchBuffer}
                                                    onChange={handleTextboxChange}
                                                    onKeyPress={handleSearchKeyPress}
                                                    className="w-full sm:w-64 pl-10 pr-16 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                
                                                {/* Clear button */}
                                                {searchBuffer && (
                                                    <button
                                                        onClick={handleClearSearch}
                                                        className="absolute right-24 top-3 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={handleSearchSubmit}
                                                    className="ml-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm text-sm hover:bg-blue-700 transition-colors"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                            
                                            {/* Member Name Search */}
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search by member name..."
                                                    value={memberSearchQuery}
                                                    onChange={handleMemberSearchChange}
                                                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-full">
                                            <CreditCard className="h-6 w-6 text-blue-700" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Total Transactions</p>
                                            <p className="text-xl font-bold">{totalItems}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="bg-green-100 p-3 rounded-full">
                                            <DollarSign className="h-6 w-6 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Fully Paid</p>
                                            <p className="text-xl font-bold">{transactions.filter(t => t.transaction_status === 'FULL').length}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="bg-yellow-100 p-3 rounded-full">
                                            <DollarSign className="h-6 w-6 text-yellow-700" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Partially Paid</p>
                                            <p className="text-xl font-bold">{transactions.filter(t => t.transaction_status === 'PARTIAL').length}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="bg-purple-100 p-3 rounded-full">
                                            <Users className="h-6 w-6 text-purple-700" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Unique Customers</p>
                                            <p className="text-xl font-bold">
                                                {new Set(transactions.map(t => t.member?.id)).size}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Table Section */}
                            <Card>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-pulse flex flex-col items-center">
                                                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <div className="text-gray-600">Loading transactions...</div>
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="text-center p-8">
                                                <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
                                                <div className="text-gray-600">{error}</div>
                                                <Button className="mt-4" onClick={fetchTransactions}>Try Again</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th
                                                            onClick={() => handleSort('transaction_id')}
                                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center">
                                                                <span>Transaction ID</span>
                                                                {sortField === 'transaction_id' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('member_name')}
                                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center">
                                                                <span>Member</span>
                                                                {sortField === 'member_name' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('total_paid_amount')}
                                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center justify-end">
                                                                <span>Paid Amount</span>
                                                                {sortField === 'total_paid_amount' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('outstanding')}
                                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center justify-end">
                                                                <span>Outstanding</span>
                                                                {sortField === 'outstanding' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('transaction_status')}
                                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center">
                                                                <span>Status</span>
                                                                {sortField === 'transaction_status' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('date')}
                                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center">
                                                                <span>Date</span>
                                                                {sortField === 'date' && (
                                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {transactions.map((transaction) => (
                                                        <tr key={transaction.transaction_id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                <div className="flex flex-col">
                                                                    <span>#{transaction.transaction_id}</span>
                                                                    <span className="text-xs text-gray-500 mt-1">
                                                                        {transaction.has_services && <span className="mr-1">Services</span>}
                                                                        {transaction.has_products && <span className="mr-1">Products</span>}
                                                                        {transaction.has_care_packages && <span>Packages</span>}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {transaction.member ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{transaction.member.name}</span>
                                                                        <span className="text-xs text-gray-500 mt-1">{transaction.member.contact}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">Guest</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                <span className={parseFloat(transaction.total_paid_amount) < 0 ? 'text-red-600 font-medium' : 'font-medium'}>
                                                                    {formatCurrency(transaction.total_paid_amount)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                <span className={parseFloat(transaction.outstanding_total_payment_amount) > 0 ? 'text-amber-600 font-medium' : 'font-medium'}>
                                                                    {formatCurrency(transaction.outstanding_total_payment_amount)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                                    ${transaction.transaction_status === 'FULL' ? 'bg-green-100 text-green-800' :
                                                                     transaction.transaction_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                                     'bg-red-100 text-red-800'}`}>
                                                                    {transaction.transaction_status === 'FULL' ? 'Fully Paid' :
                                                                     transaction.transaction_status === 'PARTIAL' ? 'Partially Paid' :
                                                                     transaction.transaction_status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(transaction.transaction_created_at)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleView(transaction.transaction_id)}
                                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                                        View
                                                                    </button>
                                                                    
                                                                    {parseFloat(transaction.total_paid_amount) > 0 && (
                                                                        <button
                                                                            onClick={() => handleRefund(transaction)}
                                                                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                                                                        >
                                                                            Refund
                                                                        </button>
                                                                    )}
                                                                    {(transaction.process_payment) && (
                                                                        <button
                                                                            onClick={() => navigate(`/sale-transaction/process-payment/${transaction.transaction_id}`)}
                                                                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                                                                        >
                                                                            Pay Balance
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {transactions.length === 0 && (
                                                        <tr>
                                                            <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                                                                        <Search className="h-6 w-6 text-gray-400" />
                                                                    </div>
                                                                    <p className="font-medium text-gray-600">No transactions found</p>
                                                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                            
                                            
                                            <PaginationControls 
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                totalItems={totalItems}
                                                itemsPerPage={itemsPerPage}
                                                loading={loading}
                                                onPrevPage={handlePrevPage}
                                                onNextPage={handleNextPage}
                                                onPageChange={handlePageChange}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default SaleTransactionList;
