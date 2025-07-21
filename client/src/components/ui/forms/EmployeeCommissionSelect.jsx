import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import useEmployeeCommissionStore from '@/stores/useEmployeeCommissionStore';
import { cn } from '@/lib/utils';

const EmployeeCommissionSelect = ({
  itemId,
  itemType,
  totalPrice,
  onAssignmentsChange,
  className = '',
  formatCurrency = (value) => `$${value.toFixed(2)}`,
  disabled = false,
}) => {
  const [tempEmployeeSelection, setTempEmployeeSelection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use refs to track if we're in initialization phase
  const isInitialized = useRef(false);
  const lastTotalPrice = useRef(totalPrice);
  const lastItemType = useRef(itemType);

  // Store selectors
  const employees = useEmployeeCommissionStore((state) => state.employees);
  const commissionSettings = useEmployeeCommissionStore((state) => state.commissionSettings);
  const commissionSettingsError = useEmployeeCommissionStore((state) => state.commissionSettingsError);
  const loading = useEmployeeCommissionStore((state) => state.loading);
  const error = useEmployeeCommissionStore((state) => state.error);
  const commissionAssignments = useEmployeeCommissionStore((state) => state.commissionAssignments);

  // Store actions
  const fetchDropdownEmployees = useEmployeeCommissionStore((state) => state.fetchDropdownEmployees);
  const fetchCommissionSettings = useEmployeeCommissionStore((state) => state.fetchCommissionSettings);
  const getCommissionRate = useEmployeeCommissionStore((state) => state.getCommissionRate);
  const calculatePerformanceRate = useEmployeeCommissionStore((state) => state.calculatePerformanceRate);
  const calculatePerformanceAmount = useEmployeeCommissionStore((state) => state.calculatePerformanceAmount);
  const calculateCommissionAmount = useEmployeeCommissionStore((state) => state.calculateCommissionAmount);
  const setCommissionAssignments = useEmployeeCommissionStore((state) => state.setCommissionAssignments);

  // Get current assignments for this item
  const currentAssignments = commissionAssignments[itemId] || [];

  // Memoize filtered employees to prevent unnecessary re-renders
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Load initial data - only run once or when dependencies actually change
  useEffect(() => {
    if (employees.length === 0 && !loading) {
      fetchDropdownEmployees();
    }
  }, [employees.length, loading, fetchDropdownEmployees]);

  // Fetch commission settings - only if not already failed
  useEffect(() => {
    if (!commissionSettingsError &&
      (!commissionSettings || Object.keys(commissionSettings).length === 0)) {
      fetchCommissionSettings();
    }
  }, [commissionSettings, commissionSettingsError, fetchCommissionSettings]);

  // Notify parent of assignment changes - use JSON.stringify to compare arrays properly
  const assignmentsString = JSON.stringify(currentAssignments);
  useEffect(() => {
    if (onAssignmentsChange && isInitialized.current) {
      onAssignmentsChange(itemId, currentAssignments);
    }
  }, [assignmentsString, itemId, onAssignmentsChange]);

  // Mark as initialized after first render
  useEffect(() => {
    isInitialized.current = true;
  }, []);

  // Create a new assignment
  const createAssignment = useCallback((employeeId) => {
    const selectedEmployee = employees.find(emp => emp.id === String(employeeId));
    if (!selectedEmployee) return null;

    const totalEmployees = currentAssignments.length + 1;
    const performanceRate = calculatePerformanceRate(totalEmployees);
    const commissionRate = getCommissionRate(itemType);
    const performanceAmount = calculatePerformanceAmount(totalPrice, performanceRate);
    const commissionAmount = calculateCommissionAmount(performanceAmount, commissionRate);

    return {
      id: crypto.randomUUID(),
      employeeId: String(employeeId),
      employeeName: selectedEmployee.employee_name,
      performanceRate: performanceRate,
      performanceAmount: performanceAmount,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
      remarks: ''
    };
  }, [employees, currentAssignments.length, calculatePerformanceRate, getCommissionRate,
    calculatePerformanceAmount, calculateCommissionAmount, itemType, totalPrice]);

  // Redistribute performance rates equally among all assignments
  const redistributePerformanceRates = useCallback((assignments) => {
    if (assignments.length === 0) return [];

    const equalRate = parseFloat(calculatePerformanceRate(assignments.length).toFixed(2));

    return assignments.map(assignment => {
      const performanceAmount = calculatePerformanceAmount(totalPrice, equalRate);
      const commissionAmount = calculateCommissionAmount(performanceAmount, assignment.commissionRate);

      return {
        ...assignment,
        performanceRate: equalRate,
        performanceAmount: performanceAmount,
        commissionAmount: commissionAmount
      };
    });
  }, [calculatePerformanceRate, calculatePerformanceAmount, calculateCommissionAmount, totalPrice]);

  // Handle adding a new employee assignment
  const handleAddEmployeeAssignment = useCallback(() => {
    if (!tempEmployeeSelection || disabled) return;

    const newAssignment = createAssignment(tempEmployeeSelection);
    if (!newAssignment) return;

    // Update existing assignments with new equal rates
    const updatedExistingAssignments = redistributePerformanceRates(currentAssignments);
    const allAssignments = [...updatedExistingAssignments, newAssignment];

    // Redistribute all assignments to ensure equal rates
    const finalAssignments = redistributePerformanceRates(allAssignments);

    setCommissionAssignments(itemId, finalAssignments);
    setTempEmployeeSelection('');
  }, [tempEmployeeSelection, disabled, createAssignment, redistributePerformanceRates,
    currentAssignments, setCommissionAssignments, itemId]);

  // Handle removing an employee assignment
  const handleRemoveEmployeeAssignment = useCallback((assignmentId) => {
    if (disabled) return;

    const updatedAssignments = currentAssignments.filter(assignment => assignment.id !== assignmentId);
    const redistributedAssignments = redistributePerformanceRates(updatedAssignments);

    setCommissionAssignments(itemId, redistributedAssignments);
  }, [disabled, currentAssignments, redistributePerformanceRates, setCommissionAssignments, itemId]);

  // Handle updating a specific assignment field
  const handleUpdateAssignment = useCallback((assignmentId, field, value) => {
    if (disabled) return;

    const updatedAssignments = currentAssignments.map(assignment => {
      if (assignment.id === assignmentId) {
        const updatedAssignment = { ...assignment, [field]: value };

        // Auto-calculate performance amount when rate changes
        if (field === 'performanceRate') {
          // For single employee, force rate to 100%
          if (currentAssignments.length === 1) {
            updatedAssignment.performanceRate = 100;
          } else {
            // Clamp rate between 0 and 100
            const rate = parseFloat(Math.min(100, Math.max(0, parseFloat(value) || 0)).toFixed(2));
            updatedAssignment.performanceRate = rate;
          }

          const performanceAmount = calculatePerformanceAmount(totalPrice, updatedAssignment.performanceRate);
          updatedAssignment.performanceAmount = performanceAmount;
          updatedAssignment.commissionAmount = calculateCommissionAmount(performanceAmount, updatedAssignment.commissionRate);
        }

        // Auto-calculate commission amount when commission rate changes
        if (field === 'commissionRate') {
          const commissionRate = parseFloat(value) || 0;
          updatedAssignment.commissionRate = commissionRate;
          updatedAssignment.commissionAmount = calculateCommissionAmount(updatedAssignment.performanceAmount, commissionRate);
        }

        return updatedAssignment;
      }
      return assignment;
    });

    // If performance rate was updated and there are 2 assigned employees, auto-distribute remaining rate
    if (field === 'performanceRate' && currentAssignments.length === 2) {
      const updatedEmployee = updatedAssignments.find(a => a.id === assignmentId);
      const otherEmployees = updatedAssignments.filter(a => a.id !== assignmentId);

      if (updatedEmployee && otherEmployees.length > 0) {
        const remainingRate = 100 - updatedEmployee.performanceRate;
        const ratePerOtherEmployee = remainingRate / otherEmployees.length;

        const finalAssignments = updatedAssignments.map(assignment => {
          if (assignment.id !== assignmentId) {
            const performanceAmount = calculatePerformanceAmount(totalPrice, ratePerOtherEmployee);
            const commissionAmount = calculateCommissionAmount(performanceAmount, assignment.commissionRate);

            return {
              ...assignment,
              performanceRate: ratePerOtherEmployee,
              performanceAmount: performanceAmount,
              commissionAmount: commissionAmount
            };
          }
          return assignment;
        });

        setCommissionAssignments(itemId, finalAssignments);
        return;
      }
    }

    setCommissionAssignments(itemId, updatedAssignments);
  }, [disabled, currentAssignments, calculatePerformanceAmount, calculateCommissionAmount,
    totalPrice, setCommissionAssignments, itemId]);

  // Recalculate assignments when totalPrice or itemType changes - FIXED VERSION
  useEffect(() => {
    // Only recalculate if we have assignments and the values actually changed
    if (currentAssignments.length > 0 && isInitialized.current) {
      const priceChanged = lastTotalPrice.current !== totalPrice;
      const typeChanged = lastItemType.current !== itemType;

      if (priceChanged || typeChanged) {
        const recalculatedAssignments = currentAssignments.map(assignment => {
          const commissionRate = getCommissionRate(itemType);
          const performanceAmount = calculatePerformanceAmount(totalPrice, assignment.performanceRate);
          const commissionAmount = calculateCommissionAmount(performanceAmount, commissionRate);

          return {
            ...assignment,
            commissionRate: commissionRate,
            performanceAmount: performanceAmount,
            commissionAmount: commissionAmount
          };
        });

        setCommissionAssignments(itemId, recalculatedAssignments);

        // Update the refs
        lastTotalPrice.current = totalPrice;
        lastItemType.current = itemType;
      }
    }
  }, [totalPrice, itemType, currentAssignments.length]); // Removed function dependencies

  // Memoize summary calculations to prevent unnecessary re-renders
  const summaryData = useMemo(() => {
    const totalPerformanceRate = currentAssignments.reduce((sum, a) => sum + a.performanceRate, 0);
    const totalCommission = currentAssignments.reduce((sum, a) => sum + a.commissionAmount, 0);
    const commissionRate = currentAssignments[0]?.commissionRate || 0;

    // Create individual employee summaries
    const employeeSummaries = currentAssignments.map(assignment => ({
      employeeName: assignment.employeeName,
      performanceRate: assignment.performanceRate.toFixed(1),
      commissionAmount: formatCurrency(assignment.commissionAmount),
    }));

    return {
      totalCommission: formatCurrency(totalCommission),
      commissionRate: commissionRate.toFixed(2),
      employeeSummaries
    };
  }, [currentAssignments, formatCurrency]);

  if (loading) {
    return (
      <div className={cn('p-4 border rounded-md bg-gray-50', className)}>
        <div className="text-sm text-gray-600">Loading employee commission data...</div>
      </div>
    );
  }

  if (error && !commissionSettingsError) {
    return (
      <div className={cn('p-4 border rounded-md bg-red-50 border-red-200', className)}>
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Show warning if commission settings failed to load */}
      {commissionSettingsError && (
        <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
          <div className="text-sm text-yellow-800">
            ⚠️ Commission settings unavailable. Using fallback rate of 6.00%.
          </div>
        </div>
      )}

      {/* Add Employee Section */}
      <div className="">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Add Employee Commission
        </Label>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select className="w-full"
              value={tempEmployeeSelection}
              onValueChange={setTempEmployeeSelection}
              disabled={disabled}
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                    autoComplete="off"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.employee_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No employees found</div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddEmployeeAssignment}
            disabled={!tempEmployeeSelection || disabled}
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Employee Assignment Cards */}
      {currentAssignments.map((assignment, idx) => (
        <div key={assignment.id} className="border rounded-md p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm text-blue-700">
              Employee #{idx + 1}: {assignment.employeeName}
            </span>
            <button
              onClick={() => handleRemoveEmployeeAssignment(assignment.id)}
              disabled={disabled}
              className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Performance Rate (0-100%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={assignment.performanceRate}
                onChange={(e) => handleUpdateAssignment(assignment.id, 'performanceRate', e.target.value)}
                disabled={disabled}
                className="text-sm w-full"
                title={currentAssignments.length === 1 ? "Disabled until 2 or more employees assigned" : ""}
              />
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Performance Amount
              </Label>
              <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm">
                {formatCurrency(assignment.performanceAmount)}
              </div>
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </Label>
              <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm">
                {assignment.commissionRate.toFixed(2)}
              </div>
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Commission Amount
              </Label>
              <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-sm">
                {formatCurrency(assignment.commissionAmount)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              Employee Remarks
            </Label>
            <Input
              type="text"
              placeholder="Enter employee remarks (optional)"
              value={assignment.remarks}
              onChange={(e) => handleUpdateAssignment(assignment.id, 'remarks', e.target.value)}
              disabled={disabled}
              className="text-sm w-full"
            />
          </div>
        </div>
      ))}

      {/* Summary */}
      {currentAssignments.length > 0 && (
        <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Commission Summary
          </div>

          {/* Individual Employee Summaries */}
          <div className="space-y-1 mb-3">
            {summaryData.employeeSummaries.map((employee, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-blue-700 font-medium">
                  {employee.employeeName}
                </span>
                <div className="text-blue-600">
                  <span className="mr-2">{employee.performanceRate}%</span>
                  <span className="font-medium">{employee.commissionAmount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Separator line */}
          <div className="border-t border-blue-200 pt-2">
            <div className="text-xs text-blue-600">
              <strong>Total Commission: {summaryData.totalCommission}</strong>
            </div>
            <div className="text-xs text-blue-600">
              <strong>Commission Rate: {summaryData.commissionRate}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCommissionSelect;