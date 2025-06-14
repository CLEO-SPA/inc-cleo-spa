import React, { useState, useEffect } from 'react';
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
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

function SaleTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Transaction state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBuffer, setSearchBuffer] = useState('');
  const [targetPageInput, setTargetPageInput] = useState('');
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
    setSearchBuffer(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
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

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setTargetPageInput('');
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages || 1}`);
    }
  };

  const handleView = (transactionId) => {
    navigate(`/transactions/${transactionId}`);
  };

  const handleRefund = (transaction) => {
    // This would typically navigate to a refund page or show a modal
    alert(`Refund for Transaction #${transaction.id} with amount ${formatCurrency(transaction.total_paid_amount)}`);
  };

  const handlePayBalance = (transaction) => {
    navigate(`/transactions/payment/${transaction.id}`);
  };

  // Generate array of page numbers to display
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage, endPage;
    
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
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  }

  // Role-based access control
  const canRefund = user?.role === 'super_admin' || user?.role === 'admin';
  const canPayBalance = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'staff';

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
                  <CardTitle>Sale Transactions</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Search and Filter Controls */}
                  <div className='flex flex-col sm:flex-row gap-4 items-end'>
                    <form onSubmit={handleSearchSubmit} className='flex-grow sm:flex-grow-0 sm:w-1/3'>
                      <Label htmlFor='search' className='sr-only'>
                        Search
                      </Label>
                      <div className='flex gap-2'>
                        <Input
                          id='search'
                          type='text'
                          placeholder='Search transactions...'
                          value={searchBuffer}
                          onChange={handleSearch}
                        />
                        <Button type='submit'>Search</Button>
                      </div>
                    </form>
                    <div className='flex items-end gap-2'>
                      <Label htmlFor='status-filter' className='mb-2'>
                        Status:
                      </Label>
                      <Select value={filter} onValueChange={(value) => setFilter(value)}>
                        <SelectTrigger id='status-filter' className='w-[160px]'>
                          <SelectValue placeholder='All Transactions' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=''>All Transactions</SelectItem>
                          <SelectItem value='FULL'>Fully Paid</SelectItem>
                          <SelectItem value='PARTIAL'>Partially Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table */}
                  {loading ? (
                    <div className='flex justify-center py-8'>
                      <div className='animate-pulse flex flex-col items-center'>
                        <div className='h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4'></div>
                        <p className='text-muted-foreground'>Loading transactions...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className='py-8 text-center'>
                      <p className='text-destructive font-medium'>Error: {error}</p>
                      <Button variant='outline' className='mt-4' onClick={fetchTransactions}>
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='cursor-pointer' onClick={() => handleSort('id')}>
                              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className='cursor-pointer' onClick={() => handleSort('member_id')}>
                              Member ID {sortField === 'member_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className='text-right cursor-pointer' onClick={() => handleSort('total_paid_amount')}>
                              Paid Amount {sortField === 'total_paid_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className='text-right cursor-pointer' onClick={() => handleSort('outstanding_total_payment_amount')}>
                              Outstanding {sortField === 'outstanding_total_payment_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className='cursor-pointer' onClick={() => handleSort('sale_transaction_status')}>
                              Status {sortField === 'sale_transaction_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className='cursor-pointer' onClick={() => handleSort('created_at')}>
                              Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className='h-24 text-center'>
                                No transactions found
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className='font-medium'>{transaction.id}</TableCell>
                                <TableCell>{transaction.member_id}</TableCell>
                                <TableCell className={`text-right ${parseFloat(transaction.total_paid_amount) < 0 ? 'text-destructive' : ''}`}>
                                  {formatCurrency(transaction.total_paid_amount)}
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatCurrency(transaction.outstanding_total_payment_amount)}
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                    ${transaction.sale_transaction_status === 'FULL' ? 'bg-green-100 text-green-800' :
                                    transaction.sale_transaction_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                                    {transaction.sale_transaction_status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {new Date(transaction.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className='max-w-xs truncate'>
                                  {transaction.remarks || 'N/A'}
                                </TableCell>
                                <TableCell className='text-right'>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant='ghost' className='h-8 w-8 p-0'>
                                        <span className='sr-only'>Open menu</span>
                                        <MoreHorizontal className='h-4 w-4' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem onClick={() => handleView(transaction.id)}>
                                        <Eye className='mr-2 h-4 w-4' />
                                        View Details
                                      </DropdownMenuItem>
                                      
                                      {parseFloat(transaction.total_paid_amount) > 0 && canRefund && (
                                        <DropdownMenuItem onClick={() => handleRefund(transaction)}>
                                          <Edit className='mr-2 h-4 w-4' />
                                          Process Refund
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {transaction.sale_transaction_status === 'PARTIAL' && canPayBalance && (
                                        <DropdownMenuItem onClick={() => handlePayBalance(transaction)}>
                                          <Edit className='mr-2 h-4 w-4' />
                                          Pay Balance
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {/* Pagination Controls */}
                  {totalPages > 0 && (
                    <div className='flex flex-col sm:flex-row items-center justify-between w-full gap-4'>
                      <div className='text-sm text-muted-foreground'>
                        Page {currentPage} of {totalPages} (Total: {totalItems} items)
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1 || loading}
                        >
                          <ChevronsLeft className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handlePrevPage}
                          disabled={currentPage === 1 || loading}
                        >
                          <ChevronLeft className='h-4 w-4' />
                          Previous
                        </Button>
                        {pageNumbers.map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button 
                          variant='outline' 
                          size='sm' 
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                          <ChevronRight className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages || loading}
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
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default SaleTest;