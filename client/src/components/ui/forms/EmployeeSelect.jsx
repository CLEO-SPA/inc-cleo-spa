import { Controller, useFormContext } from 'react-hook-form';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import useEmployeeStore from '@/stores/useEmployeeStore';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

export function EmployeeSelect({
  name = 'employee_id',
  label = 'Assigned Employee *',
  disabled: customDisabled = false,
  customOptions = [],
  className = '',
  customHeight = false,
  control: controlProp,
  onChange: onChangeProp,
  value: valueProp,
  errors: errorsProp,
}) {
  const formContext = useFormContext();
  const control = controlProp || formContext?.control;
  const errors = errorsProp || formContext?.formState?.errors || {};

  const employees = useEmployeeStore((state) => state.dropdownEmployees);
  const loading = useEmployeeStore((state) => state.isFetchingDropdown);
  const error = useEmployeeStore((state) => state.error);
  const fetchDropdownEmployees = useEmployeeStore((state) => state.fetchDropdownEmployees);

  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(''); // Separate state for input value
  const [isOpen, setIsOpen] = useState(false);

  // added ref for the search input
  const searchInputRef = useRef(null);

  // debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300), // 300ms delay
    [setSearchTerm]
  );

  // Combine employees with custom options
  const allOptions = [...customOptions, ...employees];
  const filteredEmployees = allOptions.filter((emp) =>
    emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State to prevent infinite loops
  const [hasFetchedEmployees, setHasFetchedEmployees] = useState(false);

  useEffect(() => {
    if (employees.length === 0 && !loading && !hasFetchedEmployees) {
      setHasFetchedEmployees(true);
      fetchDropdownEmployees();
    }
  }, [employees.length, loading, hasFetchedEmployees, fetchDropdownEmployees]);

  // focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // use setTimeout to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const customTriggerStyle = customHeight
    ? {
        height: '42px',
        minHeight: '42px',
        padding: '8px 12px',
        fontSize: '14px',
        lineHeight: '1.5',
      }
    : {};

  // handle search input change with debouncing
  const handleSearchChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  // handle search input key events
  const handleSearchKeyDown = (e) => {
    // prevent the select from closing when typing
    e.stopPropagation();

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setInputValue('');
    }
  };

  // cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  if (!control && !onChangeProp) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label className='text-sm font-medium text-red-500'>
          EmployeeSelect Error: Must be used within a form context or provide control/onChange props
        </Label>
      </div>
    );
  }

  // Render with Controller if we have control (form context usage)
  if (control) {
    return (
      <div className={cn(customHeight ? 'space-y-1' : 'space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
            {label}
          </Label>
        )}

        <Controller
          name={name}
          control={control}
          rules={{ required: `${label} is required` }}
          render={({ field }) => (
            <div className='relative'>
              <Select
                disabled={loading || error || customDisabled}
                value={field.value?.toString() || ''}
                onValueChange={(val) => {
                  field.onChange(val);
                  setIsOpen(false);
                  setSearchTerm('');
                  setInputValue('');
                }}
                open={isOpen}
                onOpenChange={setIsOpen}
              >
                <SelectTrigger
                  className={cn('w-full', errors[name] ? 'border-red-500' : '', customHeight ? 'h-[42px]' : '')}
                  style={customTriggerStyle}
                >
                  <SelectValue
                    placeholder={
                      loading ? 'Loading employees...' : error ? 'Error loading employees' : 'Select employee'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <div className='p-2 border-b' onClick={(e) => e.stopPropagation()}>
                    <Input
                      ref={searchInputRef}
                      placeholder='Search employees...'
                      value={inputValue}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      className='h-8'
                      autoComplete='off'
                      autoFocus
                    />
                  </div>

                  <div className='max-h-48 overflow-y-auto'>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.employee_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='p-2 text-sm text-gray-500'>No employees found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {!customHeight && errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
        {!customHeight && error && <p className='text-red-500 text-xs'>Failed to load employees: {error}</p>}
      </div>
    );
  }

  // Render standalone version if onChange prop is provided
  return (
    <div className={cn(customHeight ? 'space-y-1' : 'space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
          {label}
        </Label>
      )}

      <div className='relative'>
        <Select
          disabled={loading || error || customDisabled}
          value={valueProp?.toString() || ''}
          onValueChange={(val) => {
            onChangeProp?.(Number(val));
            setIsOpen(false);
            setSearchTerm('');
            setInputValue('');
          }}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger
            className={cn('w-full', errors[name] ? 'border-red-500' : '', customHeight ? 'h-[42px]' : '')}
            style={customTriggerStyle}
          >
            <SelectValue
              placeholder={loading ? 'Loading employees...' : error ? 'Error loading employees' : 'Select employee'}
            />
          </SelectTrigger>

          <SelectContent>
            <div className='p-2 border-b' onClick={(e) => e.stopPropagation()}>
              <Input
                ref={searchInputRef}
                placeholder='Search employees...'
                value={inputValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className='h-8'
                autoComplete='off'
                autoFocus
              />
            </div>

            <div className='max-h-48 overflow-y-auto'>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.employee_name}
                  </SelectItem>
                ))
              ) : (
                <div className='p-2 text-sm text-gray-500'>No employees found</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {!customHeight && errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
      {!customHeight && error && <p className='text-red-500 text-xs'>Failed to load employees: {error}</p>}
    </div>
  );
}

export default EmployeeSelect;
