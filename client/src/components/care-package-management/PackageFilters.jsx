import { useState, useCallback, useEffect } from 'react';

const PackageFilters = ({ data = [], onFilterChange, type = "care_package" }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState([]);

  const getStatusCounts = useCallback((items) => {
    if (!items.length) return { all: 0, active: 0, inactive: 0, draft: 0, Completed: 0, Invoice_Unpaid: 0, Invoice_Paid: 0, Invoice_Partially_Paid: 0 };

    return items.reduce((acc, item) => {
      const status = item.cs_status?.status_name || '';
      acc.all++;

      if (status === 'Active') acc.active++;
      else if (status === 'Inactive') acc.inactive++;
      else if (status === 'Draft') acc.draft++;
      else if (status === 'Completed') acc.completed++;
      else if (status === 'Invoice_Unpaid') acc.Invoice_Unpaid++;
      else if (status === 'Invoice_Paid') acc.Invoice_Paid++;
      else if (status === 'Invoice_Partially_Paid') acc.Invoice_Partially_Paid++;

      return acc;
    }, { all: 0, active: 0, inactive: 0, draft: 0, Completed: 0, Invoice_Unpaid: 0, Invoice_Paid: 0, Invoice_Partially_Paid: 0 });
  }, []);

  const filterData = useCallback((items, tab) => {
    if (tab === 'all') return items;

    return items.filter(item => {
      const status = item.cs_status?.status_name || '';
      return status.toLowerCase() === tab.toLowerCase();
    });
  }, []);

  useEffect(() => {
    const filteredItems = filterData(data, activeTab);
    onFilterChange(filteredItems);
  }, [activeTab, data, filterData, onFilterChange]);

  const statusCounts = getStatusCounts(data);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Invoice_Unpaid', label: 'Unpaid' },
    { id: 'Invoice_Paid', label: 'Paid' },
    { id: 'Invoice_Partially_Paid', label: 'Partial Paid' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'draft', label: 'Draft' },
  ].filter(tab => tab.id === 'all' || statusCounts[tab.id] > 0);

  return (
    <div className="flex gap-2 border-b border-gray-300 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-700 hover:text-gray-900'
            }`}
        >
          {`${tab.label} (${statusCounts[tab.id]})`}
        </button>
      ))}
    </div>
  );
};

export default PackageFilters;