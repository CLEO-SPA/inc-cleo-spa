import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MemberSearch from './MemberSearch';
import ReceiptSearch from '@/components/refund/ReceiptSearch';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const RefundPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('member'); // 'member' or 'receipt'

  if (loading) return <div className="p-4">Loading authentication...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Refund Management</h1>

                {/* Tabs */}
                <div className="mb-6 flex border-b border-gray-300">
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

                <div className="bg-white rounded-lg shadow p-6">
                  {activeTab === 'member' && (
                    <MemberSearch
                      onViewMCP={(member) =>
                        navigate(`/refunds/member/${member.id}`, { state: { member } })
                      }
                      onRefundServices={(member) =>
                        navigate(`/refunds/services/member/${member.id}`, { state: { member } })
                      }
                    />
                  )}

                  {activeTab === 'receipt' && (
                    <ReceiptSearch
                      onSearch={(receiptNo) =>
                        navigate(`/refunds/services/receipt/${receiptNo.trim()}`)
                      }
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