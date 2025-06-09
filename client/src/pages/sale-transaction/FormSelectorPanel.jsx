import { useState } from 'react';
import useSalesTransactionStore from '@/stores/useSelectedMemberStore';

export default function FormSelectorPanel() {
  const [selectedTab, setSelectedTab] = useState('services');
  const { error, clearError } = useSalesTransactionStore();

  const tabs = [
    { key: 'services', label: 'Services' },
    { key: 'products', label: 'Products' },
    { key: 'mcp', label: 'MCP' },
    { key: 'vouchers', label: 'Vouchers' },
    { key: 'transfer_voucher', label: 'Transfer Voucher' },
    { key: 'transfer_mcp', label: 'Transfer MCP' }
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'services':
        // return <ServicesTab />;
      case 'products':
        // return <ProductsTab />;
      case 'mcp':
        // return <McpTab />;
      case 'vouchers':
        // return <VouchersTab />;
      case 'transfer_voucher':
        // return <TransferVoucherTab />;
      case 'transfer_mcp':
        // return <TransferMcpTab />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`px-4 py-2 rounded text-sm text-center ${
              selectedTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content (scrollable) */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {renderTabContent()}
      </div>
    </div>
  );
}