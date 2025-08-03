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
    <tr key={member.id} className="hover:bg-slate-50 border-b border-slate-200">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="font-medium text-slate-900">{member.name}</div>
            <div className="text-sm text-slate-500">ID: {member.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {member.phone ? (
          <div className="flex items-center">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {member.phone}
          </div>
        ) : '—'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {member.email || '—'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleViewMCP(member)}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Member Care Packages
          </button>
          <button
            onClick={() => handleRefundServices(member)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Services
          </button>
          <button
            onClick={() => handleRefundVouchers(member)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Vouchers
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className='[--header-height:calc(theme(spacing.14))] bg-slate-50 min-h-screen'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col p-8'>
              <div className='max-w-7xl mx-auto w-full'>
                {/* Header */}
                <div className="mb-8">
                  <h1 className='text-3xl font-semibold text-slate-900'>Refund Management</h1>
                  <p className='mt-2 text-sm text-slate-600'>Manage client refund transactions for Member Care Packages, Services or Member Vouchers</p>
                </div>

                {/* Navigation Tabs */}
                <div className='mb-8'>
                  <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('member')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'member'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Member Search
                    </button>
                    <button
                      onClick={() => setActiveTab('receipt')}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'receipt'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Search by Receipt
                    </button>
                  </nav>
                </div>

                {/* Main Content */}
                <div className='bg-white shadow-sm border border-slate-200 rounded-lg'>
                  {activeTab === 'member' && (
                    <div>
                      {/* Search Section */}
                      <div className="border-b border-slate-200 px-6 py-5">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Search members by name, email, or phone number..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Results Table */}
                      <div>
                        {loadingMembers ? (
                          <div className="flex justify-center py-12">
                            <div className="flex items-center text-sm text-slate-600">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>
                              Loading...
                            </div>
                          </div>
                        ) : (
                          <>
                            {searchQuery ? (
                              searchResults.length > 0 ? (
                                <>
                                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                                    <h3 className="text-sm font-medium text-slate-900">
                                      Search Results ({searchResults.length})
                                    </h3>
                                  </div>
                                  <div className="overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-200">
                                      <thead className="bg-slate-50">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Member
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Phone
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Email
                                          </th>
                                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Refund Options
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-slate-200">
                                        {searchResults.map(renderMemberItem)}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-slate-900">No results found</h3>
                                  <p className="mt-1 text-sm text-slate-500">
                                    No members match your search for "{searchQuery}"
                                  </p>
                                </div>
                              )
                            ) : (
                              allMembers.length > 0 ? (
                                <>
                                  
                                  <div className="overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-200">
                                      <thead className="bg-slate-50">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Members ({pagination.total})
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Phone
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Email
                                          </th>
                                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Refund Options
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-slate-200">
                                        {allMembers.map(renderMemberItem)}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  {/* Professional Pagination */}
                                  {pagination.totalPages > 1 && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                                      <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                          onClick={() => handlePageChange(pagination.page - 1)}
                                          disabled={pagination.page === 1}
                                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Previous
                                        </button>
                                        <button
                                          onClick={() => handlePageChange(pagination.page + 1)}
                                          disabled={pagination.page >= pagination.totalPages}
                                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Next
                                        </button>
                                      </div>
                                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                          <p className="text-sm text-slate-700">
                                            Showing{' '}
                                            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                                            {' '}to{' '}
                                            <span className="font-medium">
                                              {Math.min(pagination.page * pagination.limit, pagination.total)}
                                            </span>
                                            {' '}of{' '}
                                            <span className="font-medium">{pagination.total}</span>
                                            {' '}results
                                          </p>
                                        </div>
                                        <div>
                                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                              onClick={() => handlePageChange(pagination.page - 1)}
                                              disabled={pagination.page === 1}
                                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            </button>
                                            
                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                              let pageNum;
                                              if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                              } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                              } else if (pagination.page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                              } else {
                                                pageNum = pagination.page - 2 + i;
                                              }

                                              return (
                                                <button
                                                  key={pageNum}
                                                  onClick={() => handlePageChange(pageNum)}
                                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    pagination.page === pageNum
                                                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                                  }`}
                                                >
                                                  {pageNum}
                                                </button>
                                              );
                                            })}

                                            <button
                                              onClick={() => handlePageChange(pagination.page + 1)}
                                              disabled={pagination.page >= pagination.totalPages}
                                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                              </svg>
                                            </button>
                                          </nav>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-12">
                                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-slate-900">No members found</h3>
                                  <p className="mt-1 text-sm text-slate-500">Get started by adding members to the system.</p>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'receipt' && (
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-slate-900">Search by Receipt</h3>
                        <p className="mt-1 text-sm text-slate-600">Search for refund transactions using receipt numbers</p>
                      </div>
                      <ReceiptSearch
                        onSearch={(receiptNo) => navigate(`/refunds/services/receipt/${receiptNo.trim()}`)}
                      />
                    </div>
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