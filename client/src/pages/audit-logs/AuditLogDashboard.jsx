import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuPencil, LuPlus, LuTrash2, LuClipboardList } from 'react-icons/lu';
import { format } from 'date-fns';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

const LogTypeTab = ({ active, label, count, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-6 py-4 ${
      active ? 'bg-white text-gray-900 border border-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
    } rounded-lg transition-colors`}
  >
    <Icon className="h-5 w-5" />
    <span className="ml-4">{label}</span>
    {count !== undefined && (
      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">{count}</span>
    )}
  </button>
);

const DataTable = ({ data, tableName }) => {
  if (!data || typeof data !== 'object') return null;

  // Special handling for employee-related fields
  const renderValue = (key, value) => {
    if (
      key === 'employee_id' ||
      key === 'invoice_payment_created_by' ||
      key === 'invoice_payment_updated_by' ||
      key === 'created_by'
    ) {
      return (
        <div className="flex items-center space-x-2">
          <span>{value}</span>
          {data.employee_name && <span className="text-blue-600">({data.employee_name})</span>}
        </div>
      );
    }

    return typeof value === 'object' ? (
      <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
    ) : (
      String(value)
    );
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{renderValue(key, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AuditLogDashboard = () => {
  const [activeTab, setActiveTab] = useState('creation');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async (type) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/al/${type}`, {
        params: {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        },
      });
      setLogs(response.data.logs);
      setTotalLogs(response.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeTab);
  }, [activeTab, currentPage]);

  const renderLogContent = (log) => {
    switch (activeTab) {
      case 'creation':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Record ID: {log.record_id}</span>
            </div>
            <DataTable data={log.data} tableName={log.table_name} />
          </div>
        );

      case 'modification':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Record ID: {log.record_id}</span>
            </div>
            <div data-testid="old-data-section">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Old Data</h3>
              <DataTable data={log.old_data} tableName={log.table_name} />
            </div>
            <div data-testid="new-data-section">
              <h3 className="text-gray-600 text-sm font-medium mb-2">New Data</h3>
              <DataTable data={log.new_data} tableName={log.table_name} />
            </div>
            <div data-testid="changed-fields-section">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Changed Fields</h3>
              <DataTable data={log.changed_fields} tableName={log.table_name} />
            </div>
          </div>
        );

      case 'deletion':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Record ID: {log.record_id}</span>
            </div>
            <DataTable data={log.deleted_data} tableName={log.table_name} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 data-testid="audit-logs-heading" className="text-3xl font-bold text-gray-900">
              Audit Logs
            </h1>
            <p className="text-gray-600 mt-2">Track all system changes and activities</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <LogTypeTab
                active={activeTab === 'creation'}
                label="Creation Logs"
                icon={LuPlus}
                onClick={() => setActiveTab('creation')}
              />
              <LogTypeTab
                active={activeTab === 'modification'}
                label="Modification Logs"
                icon={LuPencil}
                onClick={() => setActiveTab('modification')}
              />
              <LogTypeTab
                active={activeTab === 'deletion'}
                label="Deletion Logs"
                icon={LuTrash2}
                onClick={() => setActiveTab('deletion')}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-red-600 py-4">{error}</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.log_id} className="bg-white border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900">{log.table_name}</CardTitle>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">Log ID: {log.log_id}</span>
                      <span className="text-sm text-gray-500">
                        Action By: {log.cs_employees?.employee_name || 'Unknown'}
                        {log.cs_employees?.employee_code && ` (${log.cs_employees.employee_code})`}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{renderLogContent(log)}</CardContent>
              </Card>
            ))}

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)}</span> of{' '}
                  <span className="font-medium">{totalLogs}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={Math.ceil(totalLogs / ITEMS_PER_PAGE)}
                      value={currentPage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= Math.ceil(totalLogs / ITEMS_PER_PAGE)) {
                          setCurrentPage(value);
                        }
                      }}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-600">of {Math.ceil(totalLogs / ITEMS_PER_PAGE)}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalLogs / ITEMS_PER_PAGE)))}
                    disabled={currentPage === Math.ceil(totalLogs / ITEMS_PER_PAGE)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLogDashboard;
