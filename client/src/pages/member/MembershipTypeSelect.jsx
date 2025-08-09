import { Controller, useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';
import { cn } from '@/lib/utils';

export function MembershipTypeSelect() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Separate selectors for better performance and to avoid re-render issues
  const membershipTypeList = useMembershipTypeStore((state) => state.membershipTypeList);
  const loading = useMembershipTypeStore((state) => state.loading);
  const error = useMembershipTypeStore((state) => state.error);
  const fetchAllMembershipType = useMembershipTypeStore((state) => state.fetchAllMembershipType);
  const [hasFetched, setHasFetched] = useState(false); // Add flag to prevent infinite loops

  useEffect(() => {
    if (membershipTypeList.length === 0 && !loading && !hasFetched) {
      setHasFetched(true);
      fetchAllMembershipType();
    }
  }, [membershipTypeList.length, loading, hasFetched, fetchAllMembershipType]);

  return (
    <div className='space-y-2'>
      <Label htmlFor='membership_type_id' className='text-sm font-medium text-gray-700'>
        Membership Type *
      </Label>

      <Controller
        name='membership_type_id'
        control={control}
        rules={{ required: 'Membership type is required' }}
        render={({ field }) => (
          <Select
            disabled={loading || error}
            value={field.value?.toString() || ''}
            onValueChange={(val) => field.onChange(Number(val))}
          >
            <SelectTrigger className={cn('w-full', errors.membership_type_id ? 'border-red-500' : '')}>
              <SelectValue
                placeholder={
                  loading ? 'Loading membership types...' : error ? 'Error loading types' : 'Select membership type'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {membershipTypeList.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.membership_type_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* Error message */}
      {errors.membership_type_id && <p className='text-red-500 text-xs'>{errors.membership_type_id.message}</p>}

      {/* Store error message */}
      {error && <p className='text-red-500 text-xs'>Failed to load membership types: {error}</p>}
    </div>
  );
}

export default MembershipTypeSelect;
