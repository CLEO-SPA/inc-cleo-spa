// client/src/components/employee-timetable/EmployeeSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';

export default function EmployeeSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSelected, setIsSelected] = useState(false); 
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    searchTerm,
    setSearchTerm,
    selectedEmployee,
    setSelectedEmployee,
    getFilteredEmployees,
    loadTimetableData,
    currentMonth
  } = useEmployeeTimetableStore();

  // Get filtered employees
  const filteredEmployees = getFilteredEmployees();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, setSearchTerm]);

  // Show dropdown when typing (but not when employee is selected)
  useEffect(() => {
    setIsOpen(inputValue.length > 0 && filteredEmployees.length > 0 && !isSelected); 
  }, [inputValue, filteredEmployees, isSelected]);

  // Handle employee selection
  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setInputValue(employee.employee_name);
    setIsSelected(true);
    setIsOpen(false);
    
    // Load that employee's timetable
    await loadTimetableData(currentMonth);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedEmployee(null);
    setInputValue('');
    setSearchTerm('');
    setIsSelected(false); 
    setIsOpen(false);
    
    // Reload all employees' timetables
    loadTimetableData(currentMonth);
  };

  // Handle input change - reset selection state when user types
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsSelected(false); 
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input when selected employee changes externally
  useEffect(() => {
    if (selectedEmployee) {
      setInputValue(selectedEmployee.employee_name);
      setIsSelected(true); 
    } else {
      setInputValue('');
      setIsSelected(false); 
    }
  }, [selectedEmployee]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor="employee-search" className="text-sm font-medium mb-2 block">
        Name Searchbar
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="employee-search"
          type="text"
          placeholder="Search employees by name..."
          value={inputValue}
          onChange={handleInputChange} 
          className="pl-10 pr-10"
        />
        
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        
        {selectedEmployee && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredEmployees.length > 0 ? (
            <div className="py-1">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium">{employee.employee_name}</div>
                  {employee.position_name && (
                    <div className="text-sm text-gray-500">{employee.position_name}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No matching employees found
            </div>
            )}
        </div>
      )}
    </div>
  );
}