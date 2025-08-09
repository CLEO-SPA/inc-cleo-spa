import { Controller, useFormContext } from 'react-hook-form';
import { useEffect, useState, useCallback } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import useMemberStore from '@/stores/useMemberStore';

// Helper function to convert text to proper case
const toProperCase = (text) => {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function MemberSelect({
  name = 'member_id',
  label = 'Assigned Member *',
  disabled: customDisabled = false,
  customOptions = [],
}) {
  const formContext = useFormContext();
  const members = useMemberStore((state) => state.members);
  const loading = useMemberStore((state) => state.loading);
  const error = useMemberStore((state) => state.error);
  const fetchDropdownMembers = useMemberStore((state) => state.fetchDropdownMembers);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // combine members with custom options
  const allOptions = [...customOptions, ...members];

  // enhanced filtering function that searches across multiple fields
  const filteredMembers = allOptions.filter((member) => {
    if (!debouncedSearchTerm) return true;

    const searchLower = debouncedSearchTerm.toLowerCase();

    // search by name
    const memberName = (member.name || '').toLowerCase();
    if (memberName.includes(searchLower)) return true;

    // search by mobile
    const phoneNumber = (member.contact || '').toString().toLowerCase();
    if (phoneNumber.includes(searchLower)) return true;

    // search by card number - to edit when column is added
    const memberCard = (member.card_number || '').toString().toLowerCase();
    if (memberCard.includes(searchLower)) return true;

    return false;
  });

  // Helper function to format member display text
  const formatMemberDisplay = (member) => {
    const memberName = toProperCase(member.name || member.member_name);
    const contact = member.contact || member.phone;
    const memberCard = member.member_card || member.card_number;

    let displayText = memberName;

    // add contact if available
    if (contact) {
      displayText += ` - ${contact}`;
    }

    // add member card if available
    // to edit display if its too messy
    if (memberCard) {
      displayText += ` (Card: ${memberCard})`;
    }

    return displayText;
  };

  // State to prevent infinite loops
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false);

  useEffect(() => {
    if (members.length === 0 && !loading && !hasFetchedMembers) {
      setHasFetchedMembers(true);
      fetchDropdownMembers();
    }
  }, [members.length, loading, hasFetchedMembers, fetchDropdownMembers]);

  const {
    control,
    formState: { errors },
  } = formContext;

  // clear search when dropdown closes
  const handleOpenChange = useCallback((open) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, []);

  // handle search input changes without losing focus
  const handleSearchChange = useCallback((e) => {
    e.stopPropagation();
    setSearchTerm(e.target.value);
  }, []);

  // handle search input events to maintain focus
  const handleSearchKeyDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleSearchClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className='relative'>
            <Select
              disabled={loading || error || customDisabled}
              value={field.value?.toString() || ''}
              onValueChange={(val) => {
                field.onChange(Number(val));
                setIsOpen(false);
                setSearchTerm('');
                setDebouncedSearchTerm('');
              }}
              open={isOpen}
              onOpenChange={handleOpenChange}
            >
              <SelectTrigger className={errors[name] ? 'border-red-500' : ''}>
                <SelectValue
                  placeholder={loading ? 'Loading members...' : error ? 'Error loading members' : 'Select member'}
                />
              </SelectTrigger>
              <SelectContent>
                <div className='p-2 border-b'>
                  <div className='relative'>
                    <Input
                      placeholder='Search by name, phone, or card...'
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      onClick={handleSearchClick}
                      onFocus={handleSearchClick}
                      className='h-8'
                      autoComplete='off'
                    />
                    {isSearching && (
                      <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
                      </div>
                    )}
                  </div>
                  {debouncedSearchTerm && (
                    <div className='text-xs text-gray-500 mt-1'>
                      Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className='max-h-48 overflow-y-auto'>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      return (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          <div className='flex flex-col'>
                            <span>{formatMemberDisplay(member)}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className='p-2 text-sm text-gray-500'>
                      {debouncedSearchTerm ? `No members found matching "${debouncedSearchTerm}"` : 'No members found'}
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
        )}
      />
      {errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
      {error && <p className='text-red-500 text-xs'>Failed to load members: {error}</p>}
    </div>
  );
}

export default MemberSelect;
