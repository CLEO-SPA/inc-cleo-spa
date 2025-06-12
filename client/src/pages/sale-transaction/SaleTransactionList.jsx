import React, { useState, useEffect } from 'react';
import { Search, Home, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const SaleTransactionList = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchBuffer, setSearchBuffer] = useState('');
    const itemsPerPage = 10;
    
    // Calculate total items and pages
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Get current page transactions
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/st/all');
            
            // Ensure we're extracting the transactions array from the response
            if (response.data && response.data.transactions) {
                let transactionData = response.data.transactions;
                
                // Apply search filter if provided
                if (searchQuery) {
                    transactionData = transactionData.filter(tx => 
                        tx.id.includes(searchQuery) || 
                        (tx.receipt_no && tx.receipt_no.includes(searchQuery)) ||
                        (tx.remarks && tx.remarks.toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                }
                
                // Apply status filter if provided
                if (filter) {
                    transactionData = transactionData.filter(tx => 
                        tx.sale_transaction_status === filter
                    );
                }
                
                // Apply sorting
                transactionData.sort((a, b) => {
                    // Handle numeric fields
                    if (['id', 'total_paid_amount', 'outstanding_total_payment_amount'].includes(sortField)) {
                        const aValue = parseFloat(a[sortField]);
                        const bValue = parseFloat(b[sortField]);
                        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                    }
                    
                    // Handle date fields
                    if (['created_at', 'updated_at'].includes(sortField)) {
                        const aDate = new Date(a[sortField]);
                        const bDate = new Date(b[sortField]);
                        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
                    }
                    
                    // Handle string fields
                    const aValue = a[sortField] || '';
                    const bValue = b[sortField] || '';
                    return sortDirection === 'asc' 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                });
                
                setTransactions(transactionData);
            } else {
                setError('Invalid response format');
            }
        } catch (err) {
            setError('Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [sortField, sortDirection, filter]);

    const handleSort = (field) => {
        setSortDirection(currentDirection => {
            if (sortField === field) {
                return currentDirection === 'asc' ? 'desc' : 'asc';
            }
            return 'desc';
        });
        setSortField(field);
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchBuffer(query);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            setSearchQuery(searchBuffer);
            fetchTransactions();
        }
    };

    const handleSearchSubmit = () => {
        setSearchQuery(searchBuffer);
        fetchTransactions();
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return num.toLocaleString('en-US', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2
        });
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleView = (transactionId) => {
        navigate(`/transactions/${transactionId}`);
    };

    const handleRefund = (transaction) => {
        // This would typically navigate to a refund page or show a modal
        alert(`Refund for Transaction #${transaction.id} with amount ${formatCurrency(transaction.total_paid_amount)}`);
    };

    const PaginationControls = () => (
        <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium 
                                hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                // Show first page, last page, and 2 pages around current page
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
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === page
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
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium 
                                hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
                <div className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
                </div>
            </div>
        </div>
    );

    // Content that will be rendered inside the sidebar layout
    const TransactionListContent = () => (
        <div className="max-w-[1600px] mx-auto p-4 space-y-6">
            {/* Header Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Sale Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Manage and track all sale transactions</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Transactions</option>
                                <option value="FULL">Fully Paid</option>
                                <option value="PARTIAL">Partially Paid</option>
                            </select>

                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchBuffer}
                                    onChange={handleSearch}
                                    onKeyDown={handleSearchKeyPress}
                                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <button
                                    onClick={handleSearchSubmit}
                                    className="ml-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                            onClick={() => handleSort('id')}
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Transaction ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('member_id')}
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Member ID {sortField === 'member_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('total_paid_amount')}
                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Paid Amount {sortField === 'total_paid_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('outstanding_total_payment_amount')}
                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Outstanding {sortField === 'outstanding_total_payment_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('sale_transaction_status')}
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Status {sortField === 'sale_transaction_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('created_at')}
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {transaction.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {transaction.member_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                <span className={parseFloat(transaction.total_paid_amount) < 0 ? 'text-red-600' : ''}>
                                                    {formatCurrency(transaction.total_paid_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatCurrency(transaction.outstanding_total_payment_amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${transaction.sale_transaction_status === 'FULL' ? 'bg-green-100 text-green-800' :
                                                     transaction.sale_transaction_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-red-100 text-red-800'}`}>
                                                    {transaction.sale_transaction_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleView(transaction.id)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                                                    >
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
                                                    {transaction.sale_transaction_status === 'PARTIAL' && (
                                                        <button
                                                            onClick={() => navigate(`/transactions/payment/${transaction.id}`)}
                                                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                                                        >
                                                            Pay Balance
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <PaginationControls />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // Main layout with sidebar
    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <TransactionListContent />
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default SaleTransactionList;