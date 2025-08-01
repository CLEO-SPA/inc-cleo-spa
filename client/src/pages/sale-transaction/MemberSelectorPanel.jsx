import { useEffect, useState, useCallback } from 'react';
import useSelectedMemberStore from '@/stores/useSelectedMemberStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import useMemberStore from '@/stores/useMemberStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  MoreHorizontal,
  X,
  Package,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ChevronDown,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

// helper function to convert text to proper case
const toProperCase = (text) => {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function MemberSelectorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // member search dropdown states
  const [actualSearchTerm, setActualSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMemberFromDropdown, setSelectedMemberFromDropdown] = useState(null);

  // other states
  const [notFound, setNotFound] = useState(false);
  const [selectedTab, setSelectedTab] = useState('info');
  const [showOwedDialog, setShowOwedDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({
    isOpen: false,
    type: null, // 'package' or 'voucher'
    item: null,
    isLoading: false,
  });

  // member dropdown store
  const {
    members: dropdownMembers,
    loading: dropdownLoading,
    error: dropdownError,
    fetchDropdownMembers,
  } = useMemberStore();

  // debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // enhanced filtering function that searches across multiple fields
  const filteredMembers = dropdownMembers.filter((member) => {
    if (!debouncedSearchTerm) return true;

    const searchLower = debouncedSearchTerm.toLowerCase();

    // search by name
    const memberName = (member.name || '').toLowerCase();
    if (memberName.includes(searchLower)) return true;

    // search by mobile/contact
    const phoneNumber = (member.contact || '').toString().toLowerCase();
    if (phoneNumber.includes(searchLower)) return true;

    // search by card number
    const memberCard = (member.card_number || '').toString().toLowerCase();
    if (memberCard.includes(searchLower)) return true;

    return false;
  });

  // helper function to format member display text
  const formatMemberDisplay = (member) => {
    const memberName = toProperCase(member.name || member.member_name);
    const contact = member.contact || member.phone;
    const memberCard = member.member_card || member.card_number;

    let displayText = memberName;

    // add contact if available
    if (contact) {
      displayText += ` - ${contact}`;
    }

    // add member card if available
    if (memberCard) {
      displayText += ` (Card: ${memberCard})`;
    }

    return displayText;
  };

  // load dropdown members on component mount
  useEffect(() => {
    if (dropdownMembers.length === 0 && !dropdownLoading) {
      fetchDropdownMembers();
    }
  }, [dropdownMembers.length, dropdownLoading, fetchDropdownMembers]);

  // handle search input changes without losing focus
  const handleSearchChange = useCallback(
    (e) => {
      e.stopPropagation();
      setSearchInput(e.target.value);
      setActualSearchTerm(''); // Clear stored search term when user types manually
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
      }
    },
    [isDropdownOpen]
  );

  // handle search input events to maintain focus
  const handleSearchKeyDown = useCallback((e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSearchInput('');
      setDebouncedSearchTerm('');
    }
  }, []);

  const handleSearchClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isDropdownOpen && searchInput) {
        setIsDropdownOpen(true);
      }
    },
    [isDropdownOpen, searchInput]
  );

  // handle member selection from dropdown
  const handleMemberSelect = async (member) => {
    try {
      setSelectedMemberFromDropdown(member);

      // Format display text for the input field
      const displayText = formatMemberDisplay(member);
      setSearchInput(displayText); // Show formatted text in input

      // Store the actual search term for future searches
      const searchTerm = member.name || member.contact || member.card_number;
      setActualSearchTerm(searchTerm); // Store the original search term

      setIsDropdownOpen(false);
      setNotFound(false);
      setSelectedTab('info');

      const foundMember = await searchMember(searchTerm);

      if (foundMember) {
        setSelectedMember(foundMember);

        if (foundMember.total_amount_owed > 0) {
          setTimeout(() => setShowOwedDialog(true), 200);
        }
      }
    } catch (error) {
      setNotFound(true);
      console.error('Member selection failed:', error);
    }
  };


  // Updated handlers that show confirmation dialog
  const handleVoucherCancel = (voucher) => {
    setCancelDialog({
      isOpen: true,
      type: 'voucher',
      item: voucher,
      isLoading: false,
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialog.item) return;

    setCancelDialog((prev) => ({ ...prev, isLoading: true }));

    try {
      if (cancelDialog.type === 'package') {
        await cancelMemberPackage(cancelDialog.item.id);
      } else if (cancelDialog.type === 'voucher') {
        await cancelMemberVoucher(cancelDialog.item.id);
      }

      setCancelDialog({ isOpen: false, type: null, item: null, isLoading: false });
    } catch (error) {
      console.error('Cancellation failed:', error);
      setCancelDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

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
    refreshCurrentMemberData,

    // Pagination states
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

    // Pagination actions
    goToPackagesPage,
    setPackagesLimit,
    setPackagesSearchTerm,
    goToVouchersPage,
    setVouchersLimit,
    setVouchersSearchTerm,

    // Cancellation
    cancelMemberPackage,
    cancelMemberVoucher,
  } = useSelectedMemberStore();

  const { selectedMember, cartItems, setSelectedMember, addCartItem, removeCartItem, getCartTotal, getItemsByType } =
    useTransactionCartStore();

  useEffect(() => {
    if (currentMember) {
      console.log('Location changed — forcing refresh of member data...');
      refreshCurrentMemberData();
    }
  }, [location.pathname]);

  // Legacy search handler (kept for backward compatibility)
const handleSearch = async () => {
  // Use actualSearchTerm if available (from dropdown selection), otherwise use searchInput
  const searchTerm = actualSearchTerm || searchInput;
  
  if (!searchTerm.trim()) return;

  try {
    const foundMember = await searchMember(searchTerm);
    
    if (foundMember) {
      setSelectedMember(foundMember);
      setNotFound(false);
      if (foundMember.total_amount_owed > 0) {
        setTimeout(() => setShowOwedDialog(true), 200);
      }
    } else {
      setNotFound(true);
    }
  } catch (error) {
    console.error('Search failed:', error);
    setNotFound(true);
  }
};

  // debounced search handlers
  const handlePackagesSearch = useCallback(
    (searchTerm) => {
      setPackagesSearchTerm(searchTerm);
    },
    [setPackagesSearchTerm]
  );

  const handleVouchersSearch = useCallback(
    (searchTerm) => {
      setVouchersSearchTerm(searchTerm);
    },
    [setVouchersSearchTerm]
  );

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

  const handleMcpViewDetails = (mcpId) => {
    navigate(`/mcp/${mcpId}`);
  };

  const handleMcpRefund = (mcpId) => {
    navigate(`/refunds/mcp/${mcpId}`)
  };

  const handleMcpConsume = (mcpId) => {
    navigate(`/mcp/${mcpId}/consume`);
  };

  const handleVoucherRefund = (voucherId) => {
    navigate(`/refunds/voucher/${voucherId}`)
  };

  const handleVoucherConsume = (voucherId) => {
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
    searchPlaceholder = 'Search...',
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

    const handleSearchSubmit = async (e) => {
      e.preventDefault();

      // Use actualSearchTerm if available (from dropdown selection), otherwise use localSearch
      const searchTerm = actualSearchTerm || localSearch;

      if (!searchTerm.trim()) return;

      try {
        const foundMember = await searchMember(searchTerm);
        if (foundMember) {
          setSelectedMember(foundMember);
          setNotFound(false);
          if (foundMember.total_amount_owed > 0) {
            setTimeout(() => setShowOwedDialog(true), 200);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setNotFound(true);
      }
    };

    if (disabled) return null;

    return (
      <div className='space-y-3 text-xs'>
        {!hideSearch && (
          <form onSubmit={handleSearchSubmit} className='flex gap-2 items-center max-w-sm'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
              <Input
                type='text'
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className='pl-9 h-7 text-xs'
              />
            </div>
            <Button type='submit' size='sm' className='h-7 px-3 text-xs'>
              Search
            </Button>
          </form>
        )}

        {!hidePaginationControls && (
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-2 text-xs'>
            <div className='flex items-center gap-3'>
              <div className='text-gray-600 text-xs'>
                Page {currentPage} of {totalPages} ({totalItems} items)
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-xs'>Items per page:</span>
                <Select value={(itemsPerPage ?? 10).toString()} onValueChange={onLimitChange}>
                  <SelectTrigger className='w-[70px] h-7 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2' className='text-xs'>
                      2
                    </SelectItem>
                    <SelectItem value='3' className='text-xs'>
                      3
                    </SelectItem>
                    <SelectItem value='5' className='text-xs'>
                      5
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={() => onPageChange(1)}
                disabled={!hasPreviousPage}
              >
                <ChevronsLeft className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-3.5 w-3.5' />
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size='sm'
                  className='h-7 w-7 p-0 text-xs'
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant='outline'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={() => onPageChange(totalPages)}
                disabled={!hasNextPage}
              >
                <ChevronsRight className='h-3.5 w-3.5' />
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
                className='w-20 h-7 text-xs'
              />
              <Button type='submit' variant='outline' size='sm' className='h-7 px-3 text-xs'>
                Go
              </Button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex gap-2 m-1 w-full max-w-sm items-center'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10' />
          <div className='relative'>
            <Input
              type='text'
              className='pl-9 pr-8 h-7 text-xs'
              placeholder='Search by name, phone, or card...'
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onClick={handleSearchClick}
              onFocus={handleSearchClick}
              disabled={memberSearchLoading || dropdownLoading}
              autoComplete='off'
            />
            <ChevronDown
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 transition-transform cursor-pointer ${isDropdownOpen ? 'rotate-180' : ''
                }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto'>
                {dropdownLoading ? (
                  <div className='p-3 text-center text-sm text-gray-500'>Loading members...</div>
                ) : dropdownError ? (
                  <div className='p-3 text-center text-sm text-red-500'>Error loading members</div>
                ) : (
                  <>
                    {isSearching && (
                      <div className='p-2 text-center text-xs text-gray-500'>
                        <div className='inline-flex items-center gap-2'>
                          <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                          Searching...
                        </div>
                      </div>
                    )}

                    {debouncedSearchTerm && !isSearching && (
                      <div className='px-3 py-1 bg-gray-50 text-xs text-gray-500 border-b'>
                        Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    <div className='max-h-48 overflow-y-auto'>
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className='px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                            onClick={() => handleMemberSelect(member)}
                          >
                            <div className='text-sm font-medium text-gray-900'>{toProperCase(member.name)}</div>
                            <div className='text-xs text-gray-500 flex gap-3'>
                              {member.contact && (
                                <span className='flex items-center gap-1'>
                                  <Phone className='h-3 w-3' />
                                  {member.contact}
                                </span>
                              )}
                              {member.card_number && (
                                <span className='flex items-center gap-1'>💳 {member.card_number}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : debouncedSearchTerm ? (
                        <div className='p-3 text-center text-sm text-gray-500'>
                          No members found matching "{debouncedSearchTerm}"
                        </div>
                      ) : (
                        <div className='p-3 text-center text-sm text-gray-500'>Start typing to search members...</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          type='button'
          className='h-7 px-3 text-xs'
          size='sm'
          onClick={handleSearch}
          disabled={memberSearchLoading || !searchInput.trim()}
        >
          {memberSearchLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Error Message */}
      {error && <p className='text-sm text-red-500'>Error: {errorMessage || 'An error occurred'}</p>}

      {/* Member Info Panel */}
      <div className='bg-gray-50 rounded shadow'>
        {/* Tabs */}
        <div className='flex gap-1'>
          {['info', 'packages', 'vouchers'].map((tab) => {
            const isActive = selectedTab === tab;

            const getTabContent = () => {
              switch (tab) {
                case 'info':
                  return 'Info';
                case 'packages':
                  const packageCount = currentMember?.member_care_package_count || 0;
                  return (
                    <div className='flex items-center gap-2'>
                      <span>Packages</span>
                      {packageCount > 0 && (
                        <div
                          className={`rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium ${isActive ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'
                            }`}
                        >
                          {packageCount}
                        </div>
                      )}
                    </div>
                  );
                case 'vouchers':
                  const voucherCount = currentMember?.voucher_count || 0;
                  return (
                    <div className='flex items-center gap-2'>
                      <span>Vouchers</span>
                      {voucherCount > 0 && (
                        <div
                          className={`rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium ${isActive ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'
                            }`}
                        >
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
                size='xs'
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
          <div className='text-sm text-gray-600 h-full flex items-center justify-center p-8'>
            {memberSearchLoading
              ? 'Searching for member...'
              : notFound
                ? 'No matching member found.'
                : 'Please search and select a member first.'}
          </div>
        ) : (
          <>
            {selectedTab === 'info' && (
              <div className='grid grid-cols-3 gap-0 text-xs border-collapse'>
                <div className='flex border border-gray-300 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Name:</span>
                  <span className='text-gray-900 font-medium'>{currentMember.name}</span>
                </div>
                <div className='flex border border-gray-300 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>NRIC:</span>
                  <span className='text-gray-600'>{currentMember.nric}</span>
                </div>
                <div className='flex border border-gray-300 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Contact:</span>
                  <span className='text-gray-600'>{currentMember.contact}</span>
                </div>

                <div className='flex border border-gray-300 border-t-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Email:</span>
                  <span className='text-gray-600 truncate'>{currentMember.email}</span>
                </div>
                <div className='flex border border-gray-300 border-t-0 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Sex:</span>
                  <span className='text-gray-600'>{currentMember.sex}</span>
                </div>
                <div className='flex border border-gray-300 border-t-0 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>DOB:</span>
                  <span className='text-gray-600'>{currentMember.dob}</span>
                </div>

                <div className='flex border border-gray-300 border-t-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Member:</span>
                  <span className='text-gray-600'>{currentMember.membership_type_name}</span>
                </div>
                <div className='flex border border-gray-300 border-t-0 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Created:</span>
                  <span className='text-gray-600'>{currentMember.created_at}</span>
                </div>
                <div className='flex border border-gray-300 border-t-0 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>By:</span>
                  <span className='text-gray-600'>{currentMember.created_by_name}</span>
                </div>

                <div className='flex border border-gray-300 border-t-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Owed:</span>
                  <span className='text-gray-600'>${currentMember.total_amount_owed}</span>
                </div>
                <div className='flex col-span-2 border border-gray-300 border-t-0 border-l-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Address:</span>
                  <span className='text-gray-600'>{currentMember.address || '—'}</span>
                </div>

                <div className='flex col-span-3 border border-gray-300 border-t-0 p-1'>
                  <span className='font-medium text-gray-700 w-20 flex-shrink-0'>Remarks:</span>
                  <span className='text-gray-600'>{currentMember.remarks || '—'}</span>
                </div>
              </div>
            )}

            {selectedTab === 'packages' && (
              <div className='p-2 flex flex-col h-full'>
                {packagesisFetching ? (
                  <div className='flex items-center justify-center flex-grow py-8'>
                    <p className='text-gray-500'>Loading packages...</p>
                  </div>
                ) : memberCarePackages.length > 0 ? (
                  <div className='flex flex-col h-full'>
                    <div className='overflow-x-auto flex-grow'>
                      <PaginationControls
                        searchTerm={packagesSearchTerm}
                        onSearch={handlePackagesSearch}
                        searchPlaceholder='Search packages...'
                        disabled={packagesisFetching}
                        hidePaginationControls
                      />
                      <Table className='table-fixed w-full [&_td]:p-1 [&_th]:h-8'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='text-xs'>Name</TableHead>
                            <TableHead className='text-xs'>Total Price</TableHead>
                            <TableHead className='text-xs'>Balance</TableHead>
                            <TableHead className='text-xs'>Remarks</TableHead>
                            <TableHead className='text-xs'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberCarePackages.map((mcp) => (
                            <TableRow key={mcp.id}>
                              <TableCell className='text-xs'>{mcp.package_name}</TableCell>
                              <TableCell className='text-xs'>${mcp.total_price}</TableCell>
                              <TableCell className='text-xs'>${mcp.balance}</TableCell>
                              <TableCell className='text-xs'>{mcp.package_remarks}</TableCell>
                              <TableCell className='w-20 px-1 py-1'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' className='h-8 w-8 p-0'>
                                      <span className='sr-only'>Open menu</span>
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='start'>
                                    <DropdownMenuItem onClick={() => handleMcpViewDetails(mcp.id)}>
                                      <X className='mr-2 h-4 w-4' />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMcpConsume(mcp.id)}>
                                      <Package className='mr-2 h-4 w-4' />
                                      Consume
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleMcpRefund(mcp.id)}
                                      className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                    >
                                      <RefreshCw className='mr-2 h-4 w-4' />
                                      Refund
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className='flex justify-end mt-2'>
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
                  <div className='flex items-center justify-center flex-grow py-8'>
                    <p className='text-gray-500'>No packages found.</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'vouchers' && (
              <div className='p-2 flex flex-col h-full'>
                {vouchersisFetching ? (
                  <div className='flex items-center justify-center flex-grow py-8'>
                    <p className='text-gray-500'>Loading vouchers...</p>
                  </div>
                ) : memberVouchers.length > 0 ? (
                  <div className='flex flex-col h-full'>
                    <div className='overflow-x-auto flex-grow'>
                      <PaginationControls
                        searchTerm={vouchersSearchTerm}
                        onSearch={handleVouchersSearch}
                        searchPlaceholder='Search vouchers...'
                        disabled={vouchersisFetching}
                        hidePaginationControls
                      />
                      <Table className='table-fixed w-full [&_td]:p-1 [&_th]:h-8'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-[120px] text-xs'>Name</TableHead>
                            <TableHead className='w-[100px] text-xs'>Current Balance</TableHead>
                            <TableHead className='w-[110px] text-xs'>Starting Balance</TableHead>
                            <TableHead className='w-[110px] text-xs'>Free of Charge</TableHead>
                            <TableHead className='w-[110px] text-xs'>Default Price</TableHead>
                            <TableHead className='w-[150px] text-xs'>Remarks</TableHead>
                            <TableHead className='w-[120px] text-xs'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberVouchers.map((voucher) => (
                            <TableRow key={voucher.id}>
                              <TableCell className='text-xs truncate'>{voucher.member_voucher_name}</TableCell>
                              <TableCell className='text-xs'>${voucher.current_balance}</TableCell>
                              <TableCell className='text-xs'>${voucher.starting_balance}</TableCell>
                              <TableCell className='text-xs'>${voucher.free_of_charge}</TableCell>
                              <TableCell className='text-xs'>${voucher.default_total_price}</TableCell>
                              <TableCell className='text-xs truncate' title={voucher.remarks}>
                                {voucher.remarks}
                              </TableCell>
                              <TableCell className='px-1 py-1'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' className='h-8 w-8 p-0'>
                                      <span className='sr-only'>Open menu</span>
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='start'>
                                    <DropdownMenuItem onClick={() => handleVoucherCancel(voucher)}>
                                      <X className='mr-2 h-4 w-4' />
                                      Void
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleVoucherConsume(voucher.id)}>
                                      <Package className='mr-2 h-4 w-4' />
                                      Consume
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleVoucherRefund(voucher)}
                                      className='text-destructive focus:text-destructive focus:bg-destructive/10'
                                    >
                                      <RefreshCw className='mr-2 h-4 w-4' />
                                      Refund
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className='flex justify-end mt-2'>
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
                  <div className='flex items-center justify-center flex-grow py-8'>
                    <p className='text-gray-500'>No vouchers found.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className='flex border border-gray-300 border-t-0'>
        <div className='flex items-center gap-2'>
          {currentMember && currentMember.total_amount_owed > 0 && (
            <Dialog open={showOwedDialog} onOpenChange={setShowOwedDialog}>
              <DialogTrigger asChild></DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-amber-500' />
                    Outstanding Balance Alert
                  </DialogTitle>
                  <DialogDescription>This member has an outstanding balance that needs attention.</DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='font-medium text-amber-800'>Member:</span>
                      <span className='text-amber-900'>{currentMember.name}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium text-amber-800'>Amount Owed:</span>
                      <span className='text-xl font-bold text-amber-900'>${currentMember.total_amount_owed}</span>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600 mt-3'>
                    Please ensure this outstanding balance is addressed before proceeding with new transactions.
                  </p>
                </div>
                <DialogFooter className='sm:justify-start'>
                  <Button type='button' variant='outline' onClick={() => setShowOwedDialog(false)}>
                    Acknowledge
                  </Button>
                  <Button
                    type='button'
                    onClick={() => {
                      setShowOwedDialog(false);
                      // Add logic to handle payment or settlement
                      // handleSettleBalance(currentMember.id);
                    }}
                  >
                    Settle Balance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* cancel dialog  */}
      <Dialog
        open={cancelDialog.isOpen}
        onOpenChange={(open) =>
          !cancelDialog.isLoading && setCancelDialog({ isOpen: open, type: null, item: null, isLoading: false })
        }
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-red-500' />
              Confirm Cancellation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this {cancelDialog.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {cancelDialog.item && (
            <div className='py-4'>
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='font-medium text-red-800'>
                    {cancelDialog.type === 'package' ? 'Package:' : 'Voucher:'}
                  </span>
                  <span className='text-red-900'>
                    {cancelDialog.type === 'package'
                      ? cancelDialog.item.package_name
                      : cancelDialog.item.member_voucher_name}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='font-medium text-red-800'>Amount:</span>
                  <span className='text-xl font-bold text-red-900'>
                    $
                    {cancelDialog.type === 'package'
                      ? cancelDialog.item.total_price
                      : cancelDialog.item.current_balance}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='sm:justify-start'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setCancelDialog({ isOpen: false, type: null, item: null, isLoading: false })}
              disabled={cancelDialog.isLoading}
            >
              Keep {cancelDialog.type}
            </Button>
            <Button type='button' variant='destructive' onClick={handleConfirmCancel} disabled={cancelDialog.isLoading}>
              {cancelDialog.isLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
