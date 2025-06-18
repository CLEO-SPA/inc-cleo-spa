import { useEffect, useState, useCallback } from 'react';
import useSelectedMemberStore from '@/stores/useSelectedMemberStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MemberSelectorPanel() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [selectedTab, setSelectedTab] = useState('info');

  // Store state and actions - Updated to match new store structure
  const {
    currentMember,
    memberCarePackages,
    memberVouchers,
    memberSearchLoading,
    packagesisFetching,
    vouchersisFetching,
    error,
    errorMessage,
    searchMember,

    // Pagination states - Updated property names
    packagesCurrentPage,
    packagesTotalPages,
    packagesTotalCount,
    packagesCurrentLimit,
    packagesSearchTerm,

    vouchersCurrentPage,
    vouchersTotalPages,
    vouchersTotalCount,
    vouchersCurrentLimit,
    vouchersSearchTerm,

    // Pagination actions - Updated method names
    goToPackagesPage,
    setPackagesLimit,
    setPackagesSearchTerm,
    goToVouchersPage,
    setVouchersLimit,
    setVouchersSearchTerm
  } = useSelectedMemberStore();

  const {
    selectedMember,
    cartItems,
    setSelectedMember,
    addCartItem,
    removeCartItem,
    getCartTotal,
    getItemsByType
  } = useTransactionCartStore();

  useEffect(() => {
    if (currentMember && (!selectedMember || selectedMember.id !== currentMember.id)) {
      setSelectedMember(currentMember);
    }
  }, [currentMember, selectedMember, setSelectedMember]);

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

  // Debounced search handlers - Updated to use new method names
  const handlePackagesSearch = useCallback((searchTerm) => {
    setPackagesSearchTerm(searchTerm);
  }, [setPackagesSearchTerm]);

  const handleVouchersSearch = useCallback((searchTerm) => {
    setVouchersSearchTerm(searchTerm);
  }, [setVouchersSearchTerm]);

  // Generate page numbers for pagination
  const generatePageNumbers = (currentPage, totalPages) => {
    const maxPagesToShow = 3;
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

  const handleConsume = (voucherId) => {
    navigate(`/mv/${voucherId}/consume`);
  };

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
    disabled = false,
    hideSearch = false,
    hidePaginationControls = false,
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
      <div className="space-y-3 text-xs">
        {/* Search Bar */}
        {!hideSearch && (
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center max-w-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 h-7 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-7 px-3 text-xs">
              Search
            </Button>
          </form>
        )}

        {/* Pagination Controls */}
        {!hidePaginationControls && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="text-gray-600 text-xs">
                Page {currentPage} of {totalPages} ({totalItems} items)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Items per page:</span>
                <Select value={(itemsPerPage ?? 10).toString()} onValueChange={onLimitChange}>
                  <SelectTrigger className="w-[70px] h-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2" className="text-xs">2</SelectItem>
                    <SelectItem value="3" className="text-xs">3</SelectItem>
                    <SelectItem value="5" className="text-xs">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(1)}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(totalPages)}
                disabled={!hasNextPage}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
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
                className="w-20 h-7 text-xs"
              />
              <Button type="submit" variant="outline" size="sm" className="h-7 px-3 text-xs">
                Go
              </Button>
            </form>
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="space y-4 ">
      {/* Member Search Bar */}
      <div className="flex gap-2 m-1 w-full max-w-sm items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            className="pl-9 h-7 text-xs"
            placeholder="Search name or phone"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={memberSearchLoading}
          />
        </div>

        <Button
          type="button"
          className="h-7 px-3 text-xs"
          size="sm"
          onClick={handleSearch}
          disabled={memberSearchLoading || !searchInput.trim()}
        >
          {memberSearchLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      {/* Error Message - Updated to use new error structure */}
      {error && (
        <p className="text-sm text-red-500">Error: {errorMessage || 'An error occurred'}</p>
      )}

      {/* Member Info Panel */}
      <div className="bg-gray-50 rounded shadow ">
        {/* Tabs */}
        <div className="flex gap-1">
          {['info', 'packages', 'vouchers'].map((tab) => {
            const isActive = selectedTab === tab;

            const getTabContent = () => {
              switch (tab) {
                case 'info':
                  return 'Info';
                case 'packages':
                  const packageCount = currentMember?.member_care_package_count || 0;
                  return (
                    <div className="flex items-center gap-2">
                      <span>Packages</span>
                      {packageCount > 0 && (
                        <div className={`rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium ${isActive
                            ? 'bg-white text-gray-800'
                            : 'bg-gray-800 text-white'
                          }`}>
                          {packageCount}
                        </div>
                      )}
                    </div>
                  );
                case 'vouchers':
                  const voucherCount = currentMember?.voucher_count || 0;
                  return (
                    <div className="flex items-center gap-2">
                      <span>Vouchers</span>
                      {voucherCount > 0 && (
                        <div className={`rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium ${isActive
                            ? 'bg-white text-gray-800'
                            : 'bg-gray-800 text-white'
                          }`}>
                          {voucherCount}
                        </div>
                      )}
                    </div>
                  );
                default:
                  return tab;
              }
            };

            return (
              <Button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                disabled={!currentMember}
                size="xs"
                className={`min-w-[90px] px-2 py-1 rounded text-xs text-center gap-2
          ${isActive ? '' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}
          ${!currentMember ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              >
                {getTabContent()}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {!currentMember ? (
          <div className="text-sm text-gray-600 h-full flex items-center justify-center p-8">
            {memberSearchLoading ? 'Searching for member...' :
              notFound ? 'No matching member found.' :
                'Please search and select a member first.'}
          </div>
        ) : (
          <>
            {selectedTab === 'info' && (
              <div className="grid grid-cols-3 gap-0 text-xs border-collapse">
                <div className="flex border border-gray-300 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Name:</span>
                  <span className="text-gray-900 font-medium">{currentMember.name}</span>
                </div>
                <div className="flex border border-gray-300 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">NRIC:</span>
                  <span className="text-gray-600">{currentMember.nric}</span>
                </div>
                <div className="flex border border-gray-300 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Contact:</span>
                  <span className="text-gray-600">{currentMember.contact}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Email:</span>
                  <span className="text-gray-600 truncate">{currentMember.email}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Sex:</span>
                  <span className="text-gray-600">{currentMember.sex}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">DOB:</span>
                  <span className="text-gray-600">{currentMember.dob}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Member:</span>
                  <span className="text-gray-600">{currentMember.membership_type_name}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Created:</span>
                  <span className="text-gray-600">{currentMember.created_at}</span>
                </div>
                <div className="flex border border-gray-300 border-t-0 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">By:</span>
                  <span className="text-gray-600">{currentMember.created_by_name}</span>
                </div>

                <div className="flex border border-gray-300 border-t-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Owed:</span>
                  <span className="text-gray-600">${currentMember.total_amount_owed}</span>
                </div>
                <div className="flex col-span-2 border border-gray-300 border-t-0 border-l-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Address:</span>
                  <span className="text-gray-600">{currentMember.address || '—'}</span>
                </div>

                <div className="flex col-span-3 border border-gray-300 border-t-0 p-1">
                  <span className="font-medium text-gray-700 w-20 flex-shrink-0">Remarks:</span>
                  <span className="text-gray-600">{currentMember.remarks || '—'}</span>
                </div>
              </div>
            )}


            {selectedTab === 'packages' && (
              <div className="p-2 flex flex-col h-full">
                {packagesisFetching ? (
                  <div className="flex items-center justify-center flex-grow py-8">
                    <p className="text-gray-500">Loading packages...</p>
                  </div>
                ) : memberCarePackages.length > 0 ? (
                  <div className="flex flex-col h-full">
                    <div className="overflow-x-auto flex-grow">
                      <PaginationControls
                        searchTerm={packagesSearchTerm}
                        onSearch={handlePackagesSearch}
                        searchPlaceholder="Search packages..."
                        disabled={packagesisFetching}
                        hidePaginationControls
                      />
                      <Table className="table-fixed w-full [&_td]:p-1 [&_th]:h-8">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Total Price</TableHead>
                            <TableHead className="text-xs">Remarks</TableHead>
                            <TableHead className="text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberCarePackages.map((mcp) => (
                            <TableRow key={mcp.id}>
                              <TableCell className="text-xs">{mcp.package_name}</TableCell>
                              <TableCell className="text-xs">${mcp.total_price}</TableCell>
                              <TableCell className="text-xs">{mcp.package_remarks}</TableCell>
                              <TableCell className="text-xs space-x-2">
                                <button onClick={() => handleViewDetails(mcp)} className="text-blue-600 hover:underline">
                                  View
                                </button>
                                <button onClick={() => handleRefund(mcp)} className="text-red-600 hover:underline">
                                  Refund
                                </button>
                                <button onClick={() => handleConsume(mcp)} className="text-green-600 hover:underline">
                                  Consume
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>

                      </Table>
                    </div>
                    <div className="flex justify-end mt-2">
                      <PaginationControls
                        currentPage={packagesCurrentPage}
                        totalPages={packagesTotalPages}
                        totalItems={packagesTotalCount}
                        itemsPerPage={packagesCurrentLimit}
                        onPageChange={goToPackagesPage}
                        onLimitChange={(value) => setPackagesLimit(parseInt(value, 10))}
                        disabled={packagesisFetching}
                        hideSearch
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-grow py-8">
                    <p className="text-gray-500">No packages found.</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'vouchers' && (
              <div className="p-2 flex flex-col h-full">
                {vouchersisFetching ? (
                  <div className="flex items-center justify-center flex-grow py-8">
                    <p className="text-gray-500">Loading vouchers...</p>
                  </div>
                ) : memberVouchers.length > 0 ? (
                  <div className="flex flex-col h-full">
                    <div className="overflow-x-auto flex-grow">
                      <PaginationControls
                        searchTerm={vouchersSearchTerm}
                        onSearch={handleVouchersSearch}
                        searchPlaceholder="Search vouchers..."
                        disabled={vouchersisFetching}
                        hidePaginationControls
                      />
                      <Table className="table-fixed w-full [&_td]:p-1 [&_th]:h-8">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px] text-xs">Name</TableHead>
                            <TableHead className="w-[100px] text-xs">Current Balance</TableHead>
                            <TableHead className="w-[110px] text-xs">Starting Balance</TableHead>
                            <TableHead className="w-[110px] text-xs">Free of Charge</TableHead>
                            <TableHead className="w-[110px] text-xs">Default Price</TableHead>
                            <TableHead className="w-[110px] text-xs">Current Paid Balance</TableHead>
                            <TableHead className="w-[150px] text-xs">Remarks</TableHead>
                            <TableHead className="w-[120px] text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {memberVouchers.map((voucher) => (
                            <TableRow key={voucher.id}>
                              <TableCell className="text-xs truncate">{voucher.member_voucher_name}</TableCell>
                              <TableCell className="text-xs">${voucher.current_balance}</TableCell>
                              <TableCell className="text-xs">${voucher.starting_balance}</TableCell>
                              <TableCell className="text-xs">${voucher.free_of_charge}</TableCell>
                              <TableCell className="text-xs">${voucher.default_total_price}</TableCell>
                              <TableCell className="text-xs">${voucher.current_paid_balance}</TableCell>
                              <TableCell className="text-xs truncate" title={voucher.remarks}>
                                {voucher.remarks}
                              </TableCell>
                              <TableCell className="text-xs space-x-2 whitespace-nowrap">
                                <button onClick={() => handleViewDetails(voucher)} className="text-blue-600 hover:underline">
                                  View
                                </button>
                                <button onClick={() => handleRefund(voucher)} className="text-red-600 hover:underline">
                                  Refund
                                </button>
                                <button onClick={() => handleConsume(voucher.id)} className="text-green-600 hover:underline">
                                  Consume
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                    </div>
                    <div className="flex justify-end mt-2">
                      <PaginationControls
                        currentPage={vouchersCurrentPage}
                        totalPages={vouchersTotalPages}
                        totalItems={vouchersTotalCount}
                        itemsPerPage={vouchersCurrentLimit}
                        onPageChange={goToVouchersPage}
                        onLimitChange={(value) => setVouchersLimit(parseInt(value, 10))}
                        disabled={vouchersisFetching}
                        hideSearch
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-grow py-8">
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