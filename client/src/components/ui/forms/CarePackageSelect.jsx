import { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function CarePackageSelect({
  name = 'care_package_id',
  label = 'Care Package Template',
  options = [],
  onSelect,
  value,
  placeholder = 'Select a care package template...',
  disabled = false,
  isLoading = false,
  error = null,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPackages = options.filter((pkg) => (pkg.label || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelect = (id) => {
    const selectedPkg = options.find((pkg) => pkg.id.toString() === id);
    if (selectedPkg && onSelect) {
      onSelect(selectedPkg);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const isDisabled = isLoading || disabled || !!error;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
          {label}
        </Label>
      )}
      <Select
        disabled={isDisabled}
        value={value?.toString() || ''}
        onValueChange={handleSelect}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={cn('w-full', error ? 'border-red-500' : '')}>
          <SelectValue placeholder={isLoading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className='p-2 border-b'>
            <Input
              placeholder='Search packages...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='h-8'
              autoFocus
            />
          </div>
          <div className='max-h-48 overflow-y-auto'>
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id.toString()}>
                  {pkg.label}
                </SelectItem>
              ))
            ) : searchTerm ? (
              <div className='p-2 text-sm text-gray-500'>No packages found matching "{searchTerm}"</div>
            ) : (
              <div className='p-2 text-sm text-gray-500'>No care packages available</div>
            )}
          </div>
        </SelectContent>
      </Select>
      {error && <p className='text-red-500 text-xs'>{error}</p>}
    </div>
  );
}

export default CarePackageSelect;
