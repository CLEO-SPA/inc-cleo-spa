import { useState, useEffect, useCallback } from 'react';
import api from '@/services/refundService';
import { debounce } from 'lodash';

const MemberSearch = ({ onViewMCP, onRefundServices, onRefundVouchers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const results = await api.searchMembers(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search members. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Clear results when component unmounts
  useEffect(() => {
    return () => {
      setSearchResults([]);
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          minLength={2}
        />
        {isSearching && (
          <div className="absolute right-3 top-3.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">
            Member Search Results
          </div>
          <ul className="divide-y divide-gray-200">
            {searchResults.map((member) => (
              <li
                key={member.id}
                className="hover:bg-gray-50 transition-colors"
              >
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
                      onClick={() => onViewMCP(member)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Member Care Packages
                    </button>
                    <button
                      onClick={() => onRefundServices(member)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Refund Services
                    </button>
                    <button
                      onClick={() => onRefundVouchers(member)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Refund Member Vouchers
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
          No members found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default MemberSearch;