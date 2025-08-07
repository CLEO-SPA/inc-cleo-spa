import { useState, useEffect } from 'react';
import api from '@/services/refundService';

const MemberList = ({ onSelectMember }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const fetchMembers = async (page = 1) => {
    try {
      setLoading(true);
      const data = await api.listMembers(page, pagination.limit);
      setMembers(data.members);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMembers(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {members.map((member) => (
              <div 
                key={member.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectMember(member)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">ID: {member.id} • {member.phone}</p>
                  </div>
                  <span className="text-sm text-blue-600">Select →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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
        </>
      )}
    </div>
  );
};

export default MemberList;