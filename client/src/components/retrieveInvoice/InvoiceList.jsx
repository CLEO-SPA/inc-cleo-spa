import React, { useState, useEffect, useMemo } from 'react';
import { Search, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../interceptors/axios';
import { debounce } from 'lodash';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [sortField, setSortField] = useState('invoice_id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Add search query buffers
  const [manualSearchBuffer, setManualSearchBuffer] = useState('');
  const [memberSearchBuffer, setMemberSearchBuffer] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (memberSearchQuery) params.append('memberSearchQuery', memberSearchQuery);
      params.append('sortField', sortField);
      params.append('sortDirection', sortDirection);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await api.get(`/ci/list?${params}`);
      const { items, total, totalPages: pages } = response.data.data;

      setInvoices(items);
      setTotalItems(total);
      setTotalPages(pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter, searchQuery, memberSearchQuery, sortField, sortDirection, currentPage]);

  const handleView = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleAlert = (invoice) => {
    alert(`Invoice ${invoice.invoice_id} Details:
Total Amount: $${invoice.total_invoice_amount.toFixed(2)} 
Outstanding: $${invoice.outstanding_total_payment_amount.toFixed(2)}
Status: ${invoice.invoice_status}`);
  };

  const handleProceedPayment = (invoice) => {
    navigate(`/invoices/payment/${invoice.invoice_id}`);
  };

  const handleEdit = (invoiceId) => {
    navigate(`/ci/edit/${invoiceId}`);
  };

  const handleSort = (field) => {
    setSortDirection((currentDirection) => {
      if (sortField === field) {
        return currentDirection === 'asc' ? 'desc' : 'asc';
      }
      return 'desc';
    });
    setSortField(field);
  };

  const handleManualSearch = (e) => {
    const query = e.target.value;
    setManualSearchBuffer(query);

    if (query.length === 0) {
      setSearchQuery('');
      return;
    }

    if (query.length % 3 === 0) {
      setSearchQuery(query);
    }
  };

  const handleMemberSearch = (e) => {
    const query = e.target.value;
    setMemberSearchBuffer(query);

    if (query.length === 0) {
      setMemberSearchQuery('');
      return;
    }

    if (query.length % 3 === 0) {
      setMemberSearchQuery(query);
    }
  };

  const handleManualSearchKeyPress = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Add keyCode check for broader compatibility
      setSearchQuery(manualSearchBuffer);
    }
  };

  const handleMemberSearchKeyPress = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Add keyCode check for broader compatibility
      setMemberSearchQuery(memberSearchBuffer);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-600">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
              .filter((page) => {
                // Show first page, last page, and 2 pages around current page
                const nearCurrent = Math.abs(page - currentPage) <= 1;
                const isFirstOrLast = page === 1 || page === totalPages;
                return nearCurrent || isFirstOrLast;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && <span className="px-2">...</span>}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === page ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
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
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                <p className="mt-1 text-sm text-gray-500">Manage and track your invoice records</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Invoices</option>
                <option value="package">Packages</option>
                <option value="service">Services</option>
                <option value="product">Products</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Manual Invoice # (searches every 3 chars)"
                  value={manualSearchBuffer}
                  onChange={handleManualSearch}
                  onKeyDown={handleManualSearchKeyPress}
                  className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Member Name (searches every 3 chars)"
                  value={memberSearchBuffer}
                  onChange={handleMemberSearch}
                  onKeyDown={handleMemberSearchKeyPress}
                  className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th
                    onClick={() => handleSort('invoice_id')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Invoice ID {sortField === 'invoice_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('manual_invoice_no')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Manual # {sortField === 'manual_invoice_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('member_name')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Member Name {sortField === 'member_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('total_amount')}
                    className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Total Amount {sortField === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th
                    onClick={() => handleSort('outstanding')}
                    className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Outstanding {sortField === 'outstanding' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.manual_invoice_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.member ? invoice.member.name : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${invoice.total_invoice_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${invoice.total_paid_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${invoice.outstanding_total_payment_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                ${
                                                  invoice.invoice_status === 'Invoice_Paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : invoice.invoice_status === 'Invoice_Unpaid'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}
                      >
                        {invoice.invoice_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.invoice_created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(invoice.invoice_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(invoice.invoice_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                        {invoice.outstanding_total_payment_amount > 0 && (
                          <>
                            <button
                              onClick={() => handleAlert(invoice)}
                              className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                            >
                              Alert
                            </button>
                            <button
                              onClick={() => handleProceedPayment(invoice)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                            >
                              Pay Now
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
