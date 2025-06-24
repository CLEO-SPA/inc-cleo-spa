import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MemberMCPSearch from './MemberMCPSearch';

const RefundPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="p-4">Loading authentication...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectMember = (member) => {
    console.log('Selected member:', member); // Debug log
    navigate(`/refunds/member/${member.id}`, {
      state: { member } // Pass member data through route state
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Refund Management</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <MemberMCPSearch onSelectMember={handleSelectMember} />
      </div>
    </div>
  );
};

export default RefundPage;