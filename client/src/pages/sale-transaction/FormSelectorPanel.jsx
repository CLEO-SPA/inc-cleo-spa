import { useState } from 'react';
import useSalesTransactionStore from '@/stores/useSelectedMemberStore';
import { Button } from '@/components/ui/button';
import ServiceTab from '@/pages/sale-transaction/tabs/ServiceTab';
import ProductTab from '@/pages/sale-transaction/tabs/ProductTab';

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
        return <ServiceTab onServiceSelect={(service) => console.log('Service selected:', service)} />;
      case 'products':
        return <ProductTab onProductSelect={(product) => console.log('Product selected:', product)} />;
      case 'mcp':
        return <div className="p-4 text-gray-500">MCP tab content coming soon</div>;
      case 'vouchers':
        return <div className="p-4 text-gray-500">Vouchers tab content coming soon</div>;
      case 'transfer_voucher':
        return <div className="p-4 text-gray-500">Transfer Voucher tab content coming soon</div>;
      case 'transfer_mcp':
        return <div className="p-4 text-gray-500">Transfer MCP tab content coming soon</div>;
      default:
        return <div className="p-4 text-gray-500">Select a tab</div>;
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
          <Button
            key={tab.key}
            size="sm"
            variant={selectedTab === tab.key ? "default" : "outline"}
            onClick={() => setSelectedTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content (scrollable) */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 mt-4 rounded-md">
        {renderTabContent()}
      </div>
    </div>
  );
}