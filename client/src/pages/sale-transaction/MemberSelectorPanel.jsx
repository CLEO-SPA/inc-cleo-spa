import { useState, useCallback } from 'react';
import useSalesTransactionStore from '@/stores/useSalesTransactionStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

export default function MemberSelectorPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [selectedTab, setSelectedTab] = useState('info');
  
  // Local search states
  const [packagesSearch, setPackagesSearch] = useState('');
  const [vouchersSearch, setVouchersSearch] = useState('');

  // Store state and actions
  const {
    currentMember,
    memberCarePackages,
    memberVouchers,
    memberSearchLoading,
    memberCarePackagesLoading,
    memberVouchersLoading,
    error,
    searchMember,
    
    // Pagination states
    packagesCurrentPage,
    packagesTotalPages,
    packagesTotalItems,
    packagesItemsPerPage,
    packagesSearchTerm,
    
    vouchersCurrentPage,
    vouchersTotalPages,
    vouchersTotalItems,
    vouchersItemsPerPage,
    vouchersSearchTerm,
    
    // Pagination actions
    setPackagesPage,
    setPackagesItemsPerPage,
    searchPackages,
    setVouchersPage,
    setVouchersItemsPerPage,
    searchVouchers
  } = useSalesTransactionStore();

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      const member = await searchMember(searchInput.trim());

      if (member) {
        setNotFound(false);
        setSelectedTab('info');
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
      console.error('Search failed:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Debounced search handlers
  const handlePackagesSearch = useCallback((searchTerm) => {
    setPackagesSearch(searchTerm);
    searchPackages(searchTerm);
  }, [searchPackages]);

  const handleVouchersSearch = useCallback((searchTerm) => {
    setVouchersSearch(searchTerm);
    searchVouchers(searchTerm);
  }, [searchVouchers]);

  // Generate page numbers for pagination
  const generatePageNumbers = (currentPage, totalPages) => {
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
    
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // Placeholder handlers for voucher actions
  const handleViewDetails = (voucher) => {
    console.log('View details for voucher:', voucher);
  };

  const handleRefund = (voucher) => {
    console.log('Refund voucher:', voucher);
  };

  const handleConsume = (voucher) => {
    console.log('Consume voucher:', voucher);
  };

  // Enhanced Pagination component
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    totalItems,
    itemsPerPage,
    onPageChange, 
    onLimitChange,
    searchTerm,
    onSearch,
    searchPlaceholder = "Search...",
    disabled = false
  }) => {
    const [targetPageInput, setTargetPageInput] = useState('');
    const [localSearch, setLocalSearch] = useState(searchTerm || '');
    
    const pageNumbers = generatePageNumbers(currentPage, totalPages);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    const handleGoToPage = (e) => {
      e.preventDefault();
      const pageNum = parseInt(targetPageInput, 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
        onPageChange(pageNum);
        setTargetPageInput('');
      } else {
        alert(`Please enter a valid page number between 1 and ${totalPages || 1}`);
      }
    };

    const handleSearchSubmit = (e) => {
      e.preventDefault();
      onSearch(localSearch);
    };

    if (disabled) return null;

    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalItems} items)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Items per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={onLimitChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={!hasPreviousPage}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={!hasNextPage}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max={totalPages}
                placeholder="Page #"
                value={targetPageInput}
                onChange={(e) => setTargetPageInput(e.target.value)}
                className="w-20 h-8"
              />
              <Button type="submit" variant="outline" size="sm">
                Go
              </Button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Member Search Bar */}
      <div className="flex gap-2 w-full max-w-sm items-center">
        <input
          type="text"
          className="flex-1 px-2 py-1 text-sm border rounded"
          placeholder="Search name or phone"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={memberSearchLoading}
        />
        <button
          onClick={handleSearch}
          disabled={memberSearchLoading || !searchInput.trim()}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {memberSearchLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500">Error: {error}</p>
      )}

      {/* Not Found */}
      {notFound && !memberSearchLoading && (
        <p className="text-sm text-red-500">No matching member found.</p>
      )}

      {/* Member Info Panel */}
      <div className="bg-gray-50 rounded shadow p-0 min-h-[250px]">
        {/* Tabs */}
        <div className="flex mb-4 gap-2">
          {['info', 'packages', 'vouchers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              disabled={!currentMember}
              className={`min-w-[120px] px-4 py-2 rounded text-sm text-center ${
                selectedTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
              } ${!currentMember ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
            >
              {tab === 'info' && 'Info'}
              {tab === 'packages' &&
                `Packages ( || 0})`}
              {tab === 'vouchers' &&
                `Vouchers ( || 0})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {!currentMember ? (
          <div className="text-sm text-gray-600 h-full flex items-center justify-center p-8">
            {memberSearchLoading ? 'Searching for member...' : 'Please search and select a member first.'}
          </div>
        ) : (
          <>
            {selectedTab === 'info' && (
              <div className="grid grid-cols-3 gap-0 text-sm border-collapse">
                <div className="flex border border-gray-300 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Name:</span>
                  <span className="text-gray-900 font-medium">{currentMember.name}</span>
                </div>
                <div className="flex border border-gray-300 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">NRIC:</span>
                  <span className="text-gray-600">{currentMember.nric}</span>
                </div>
                <div className="flex border border-gray-300 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Contact:</span>
                  <span className="text-gray-600">{currentMember.contact}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Email:</span>
                  <span className="text-gray-600 truncate">{currentMember.email}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Sex:</span>
                  <span className="text-gray-600">{currentMember.sex}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">DOB:</span>
                  <span className="text-gray-600">{currentMember.dob}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Member:</span>
                  <span className="text-gray-600">{currentMember.membership_type_name}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Created:</span>
                  <span className="text-gray-600">{currentMember.created_at}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">By:</span>
                  <span className="text-gray-600">{currentMember.created_by_name}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Owed:</span>
                  <span className="text-gray-600">${currentMember.total_amount_owed}</span>
                </div>
                <div className="flex col-span-2 border border-gray-300 border-t-0 border-l-0 p-3">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Address:</span>
                  <span className="text-gray-600">{currentMember.address || '—'}</span>
                </div>

                <div className="flex col-span-3 border border-gray-300 border-t-0 p-2">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Remarks:</span>
                  <span className="text-gray-600">{currentMember.remarks || '—'}</span>
                </div>
              </div>
            )}

            {selectedTab === 'packages' && (
              <div className="text-sm p-2">
                <PaginationControls
                  currentPage={packagesCurrentPage}
                  totalPages={packagesTotalPages}
                  totalItems={packagesTotalItems}
                  itemsPerPage={packagesItemsPerPage}
                  onPageChange={setPackagesPage}
                  onLimitChange={(value) => setPackagesItemsPerPage(parseInt(value, 10))}
                  searchTerm={packagesSearchTerm}
                  onSearch={handlePackagesSearch}
                  searchPlaceholder="Search packages..."
                  disabled={memberCarePackagesLoading}
                />
                
                {memberCarePackagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">Loading packages...</p>
                  </div>
                ) : memberCarePackages.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    {memberCarePackages.map((pkg) => (
                      <div key={pkg.id} className="border p-3 rounded bg-white">
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-gray-600">Remaining: {pkg.remaining_sessions || pkg.remaining || 0}</p>
                        {pkg.expiry_date && (
                          <p className="text-gray-500 text-xs">Expires: {pkg.expiry_date}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">No packages found.</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'vouchers' && (
              <div className="p-2">
                <PaginationControls
                  currentPage={vouchersCurrentPage}
                  totalPages={vouchersTotalPages}
                  totalItems={vouchersTotalItems}
                  itemsPerPage={vouchersItemsPerPage}
                  onPageChange={setVouchersPage}
                  onLimitChange={(value) => setVouchersItemsPerPage(parseInt(value, 10))}
                  searchTerm={vouchersSearchTerm}
                  onSearch={handleVouchersSearch}
                  searchPlaceholder="Search vouchers..."
                  disabled={memberVouchersLoading}
                />
                
                {memberVouchersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">Loading vouchers...</p>
                  </div>
                ) : memberVouchers.length > 0 ? (
                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Current Balance</TableHead>
                            <TableHead>Starting Balance</TableHead>
                            <TableHead>Free of Charge</TableHead>
                            <TableHead>Default Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberVouchers.map((voucher) => (
                            <TableRow key={voucher.id}>
                              <TableCell>{voucher.member_voucher_name}</TableCell>
                              <TableCell>${voucher.current_balance}</TableCell>
                              <TableCell>${voucher.starting_balance}</TableCell>
                              <TableCell>${voucher.free_of_charge}</TableCell>
                              <TableCell>${voucher.default_total_price}</TableCell>
                              <TableCell>{voucher.status}</TableCell>
                              <TableCell>{voucher.remarks}</TableCell>
                              <TableCell className="space-x-2">
                                <button
                                  onClick={() => handleViewDetails(voucher)}
                                  className="text-blue-600 hover:underline"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleRefund(voucher)}
                                  className="text-red-600 hover:underline"
                                >
                                  Refund
                                </button>
                                <button
                                  onClick={() => handleConsume(voucher)}
                                  className="text-green-600 hover:underline"
                                >
                                  Consume
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">No vouchers found.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}