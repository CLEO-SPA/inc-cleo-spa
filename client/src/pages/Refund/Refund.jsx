import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ReceiptSearch from '@/components/refund/ReceiptSearch';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import api from '@/services/refundService';

const RefundPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    if (user && activeTab === 'member') {
      loadAllMembers();
    }
  }, [user, activeTab, pagination.page]);

  const loadAllMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await api.listMembers(pagination.page, pagination.limit);
      setAllMembers(data.members);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoadingMembers(true);
      setSearchQuery(query);
      if (query.trim() === '') {
        setSearchResults([]);
        return;
      }
      const results = await api.searchMembers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleViewMCP = (member) => {
    navigate(`/refunds/member/${member.id}`, { state: { member } });
  };

  const handleRefundServices = (member) => {
    navigate(`/refunds/services/member/${member.id}`, { state: { member } });
  };

  const handleRefundVouchers = (member) => {
    navigate(`/refunds/vouchers/member/${member.id}`, { state: { member } });
  };

  if (loading) return <div className='p-4'>Loading authentication...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const renderMemberItem = (member) => (
    <div key={member.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
      <div className="flex justify-between items-center p-4">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium text-gray-900 truncate">
            {member.name}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span>ID: {member.id}</span>
            {member.phone && <span>Phone: {member.phone}</span>}
            {member.email && <span>Email: {member.email}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewMCP(member)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            View Member Care Packages
          </button>
          <button
            onClick={() => handleRefundServices(member)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            Refund Services
          </button>
          <button
            onClick={() => handleRefundVouchers(member)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            Refund Vouchers
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className='max-w-6xl mx-auto w-full'>
                <h1 className='text-2xl font-bold mb-6 text-gray-800'>Refund Management</h1>

                {/* Tabs */}
                <div className='mb-6 flex border-b border-gray-300'>
                  <button
                    onClick={() => setActiveTab('member')}
                    className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-150 ${
                      activeTab === 'member'
                        ? 'border-gray-800 text-gray-800'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Search Member
                  </button>
                  <button
                    onClick={() => setActiveTab('receipt')}
                    className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-150 ${
                      activeTab === 'receipt'
                        ? 'border-gray-800 text-gray-800'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Search by Receipt
                  </button>
                </div>

                <div className='bg-white rounded-lg shadow p-6'>
                  {activeTab === 'member' && (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search members by name, email, or phone..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Search Results or Member List */}
                      {searchQuery ? (
                        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          {loadingMembers ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <>
                              <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">
                                Search Results
                              </div>
                              <div className="divide-y divide-gray-200">
                                {searchResults.map(renderMemberItem)}
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                              No members found matching "{searchQuery}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            {loadingMembers ? (
                              <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                              </div>
                            ) : allMembers.length > 0 ? (
                              <>
                                <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">
                                  All Members
                                </div>
                                <div className="divide-y divide-gray-200">
                                  {allMembers.map(renderMemberItem)}
                                </div>
                              </>
                            ) : (
                              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                                No members found
                              </div>
                            )}
                          </div>

                          {/* Pagination Controls */}
                          {allMembers.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                              <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                              </span>
                              <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {activeTab === 'receipt' && (
                    <ReceiptSearch
                      onSearch={(receiptNo) => navigate(`/refunds/services/receipt/${receiptNo.trim()}`)}
                    />
                  )}
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default RefundPage;