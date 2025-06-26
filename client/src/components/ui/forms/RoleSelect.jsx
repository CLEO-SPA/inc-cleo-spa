import { Controller, useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import useRoleStore from '@/stores/useRoleStore';

export function RoleSelect({ name = 'role_name', label = 'Role *', disabled: customDisabled = false }) {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const roles = useRoleStore((state) => state.roles);
  const loading = useRoleStore((state) => state.loading);
  const error = useRoleStore((state) => state.error);
  const fetchRoles = useRoleStore((state) => state.fetchRoles);

  const [open, setOpen] = useState(false);
  const fieldValue = watch(name);

  useEffect(() => {
    if (roles.length === 0 && !loading) {
      fetchRoles();
    }
  }, [roles.length, loading, fetchRoles]);

  return (
    <div className='space-y-2'>
      <Label htmlFor={name} className='text-sm font-medium text-gray-700'>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{ required: `${label} is required` }}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={open}
                disabled={loading || error || customDisabled}
                className={cn(
                  'w-full justify-between',
                  !field.value && 'text-muted-foreground',
                  errors[name] && 'border-red-500'
                )}
              >
                {field.value
                  ? field.value
                  : loading
                  ? 'Loading roles...'
                  : error
                  ? 'Error loading roles'
                  : 'Select or create a role'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
              <Command>
                <CommandInput
                  placeholder='Search or create role...'
                  value={fieldValue || ''}
                  onValueChange={(search) => setValue(name, search, { shouldValidate: true })}
                />
                <CommandList>
                  <CommandEmpty>No role found. You can use this name.</CommandEmpty>
                  <CommandGroup>
                    {roles.map((role) => (
                      <CommandItem
                        key={role.id}
                        value={role.role_name}
                        onSelect={(selectedRoleName) => {
                          setValue(name, selectedRoleName, { shouldValidate: true });
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', field.value === role.role_name ? 'opacity-100' : 'opacity-0')}
                        />
                        {role.role_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      {errors[name] && <p className='text-red-500 text-xs'>{errors[name].message}</p>}
      {error && <p className='text-red-500 text-xs'>Failed to load roles: {error}</p>}
    </div>
  );
}
