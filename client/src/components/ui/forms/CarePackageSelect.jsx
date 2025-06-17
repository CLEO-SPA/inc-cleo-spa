import { useState, useEffect } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';

const CarePackageSelect = ({
  name,
  label,
  value,
  onSelectFullDetails,
  disabled = false,
  error = null,
  placeholder = 'Select a care package...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const { packageOptions, isLoading, fetchCarePackageOptions } = useMcpFormStore();

  // fetch package options on mount if not already loaded
  useEffect(() => {
    if (packageOptions.length === 0 && !isLoading) {
      fetchCarePackageOptions();
      console.log(packageOptions, 'packageOptions in CarePackageSelect');
    }
  }, [packageOptions.length, isLoading, fetchCarePackageOptions]);

  // find selected package when value changes
  useEffect(() => {
    if (value && packageOptions.length > 0) {
      const foundPackage = packageOptions.find((pkg) => pkg.id === value || pkg.value === value);
      setSelectedPackage(foundPackage);
    } else {
      setSelectedPackage(null);
    }
  }, [value, packageOptions]);

  // filter options based on search term
  const filteredOptions = packageOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPackage = (packageOption) => {
    setSelectedPackage(packageOption);
    setIsOpen(false);
    setSearchTerm('');

    // call the callback with the full package details
    if (onSelectFullDetails) {
      onSelectFullDetails(packageOption);
    }
  };

  const handleClearSelection = () => {
    setSelectedPackage(null);
    if (onSelectFullDetails) {
      onSelectFullDetails(null);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
          {label}
        </Label>
      )}

      <div className='relative'>
        <Button
          type='button'
          variant='outline'
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`w-full justify-between h-9 ${error ? 'border-red-500' : ''}`}
        >
          <span className={selectedPackage ? 'text-gray-900' : 'text-gray-500'}>
            {isLoading ? 'Loading packages...' : selectedPackage ? selectedPackage.label : placeholder}
          </span>
          {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <ChevronDown className='h-4 w-4 opacity-50' />}
        </Button>

        {isOpen && !disabled && !isLoading && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden'>
            {/* search input */}
            <div className='p-2 border-b border-gray-100'>
              <div className='relative'>
                <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search care packages...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8 h-8 text-sm'
                  autoFocus
                />
              </div>
            </div>

            {/* options list */}
            <div className='max-h-48 overflow-y-auto'>
              {filteredOptions.length > 0 ? (
                <>
                  {/* clear selection option */}
                  {selectedPackage && (
                    <button
                      type='button'
                      onClick={handleClearSelection}
                      className='w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100'
                    >
                      Clear selection
                    </button>
                  )}

                  {/* package options */}
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id || option.value}
                      type='button'
                      onClick={() => handleSelectPackage(option)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        selectedPackage?.id === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      <div className='font-medium'>{option.label}</div>
                      {option.description && <div className='text-xs text-gray-500 mt-1'>{option.description}</div>}
                    </button>
                  ))}
                </>
              ) : (
                <div className='px-3 py-2 text-sm text-gray-500'>
                  {searchTerm ? 'No care packages found' : 'No care packages available'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* click outside to close */}
        {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
      </div>

      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
    </div>
  );
};

export default CarePackageSelect;
