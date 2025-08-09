import { useEffect, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import usePositionStore from '@/stores/usePositionStore';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function PositionSelect({ name = 'position_ids' }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const positions = usePositionStore((state) => state.positions);
  const loading = usePositionStore((state) => state.loading);
  const error = usePositionStore((state) => state.error);
  const fetchDropdownPositions = usePositionStore((state) => state.fetchDropdownPositions);
  const [hasFetched, setHasFetched] = useState(false); // Add flag to prevent infinite loops

  useEffect(() => {
    if (positions.length === 0 && !loading && !hasFetched) {
      setHasFetched(true);
      fetchDropdownPositions();
    }
  }, [positions.length, loading, hasFetched, fetchDropdownPositions]);

  return (
    <div className='space-y-2'>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className='space-y-2'>
            {positions.map((pos) => (
              <div key={pos.id} className='flex items-center gap-2'>
                <Checkbox
                  id={`position-${pos.id}`}
                  checked={field.value?.includes(pos.id)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...(field.value || []), pos.id]
                      : field.value.filter((id) => id !== pos.id);
                    field.onChange(newValue);
                  }}
                />
                <Label htmlFor={`position-${pos.id}`} className='cursor-pointer'>
                  {pos.position_name}
                </Label>
              </div>
            ))}
            {positions.length === 0 && <p className='text-muted-foreground text-sm'>No positions available</p>}
            {errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
          </div>
        )}
      />
    </div>
  );
}
