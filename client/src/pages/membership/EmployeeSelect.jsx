import React, { useState, useEffect } from 'react';
import { api } from '@/interceptors/axios';
import FilteredSelect from '@/components/FieldSelector';

const EmployeeSelect = ({ value, onChange, label = 'Employee' }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/em/all');
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="w-full">
      <label className="block text-black mb-1">{label}</label>
      <FilteredSelect
        options={employees.map((emp) => ({
          id: emp.employee_id,
          name: emp.employee_name,
        }))}
        value={value}
        onChange={onChange}
        getOptionLabel={(option) => option.name}
        placeholder="Select an Employee"
        searchPlaceholder="Search Employee..."
        className="w-3/4"
      />
    </div>
  );
};

export default EmployeeSelect;
