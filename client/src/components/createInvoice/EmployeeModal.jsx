import { useState, useEffect } from 'react';
import { api } from '../../interceptors/axios';

const EmployeeModal = ({ isOpen, onClose, onSelectEmployee, selectedEmployee }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await api.get('/ci/getAllEmployees');
        setEmployees(response.data.data);
        setFilteredEmployees(response.data.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  // Filter employees based on search query
  useEffect(() => {
    const filtered = employees.filter(
      (employee) =>
        employee.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Employee</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name or employee code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="text-center">Loading...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.employee_id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEmployee?.employee_id === employee.employee_id
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => onSelectEmployee(employee)}
              >
                <div className="font-medium">{employee.employee_name}</div>
                <div className="text-sm text-gray-500">Code: {employee.employee_code}</div>
                <div className="text-sm text-gray-500">Department: {employee.cs_department?.department_name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
