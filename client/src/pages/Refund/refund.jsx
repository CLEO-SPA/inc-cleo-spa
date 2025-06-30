import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MemberMCPSearch from './MemberMCPSearch';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const RefundPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="p-4">Loading authentication...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectMember = (member) => {
    console.log('Selected member:', member);
    navigate(`/refunds/member/${member.id}`, {
      state: { member }
    });
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-2xl font-bold mb-6">Refund Management</h1>
                <div className="bg-white rounded-lg shadow p-6">
                  <MemberMCPSearch onSelectMember={handleSelectMember} />
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