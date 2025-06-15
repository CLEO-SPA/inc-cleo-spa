import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export default function CreateCategoryInlineForm({ onCreate, placeholder = 'Enter category name', apiEndpoint }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setCreating(true);
    setErrorMsg('');
    try {
      const response = await api.post(apiEndpoint, {
        service_category_name: name.trim(),
      });

      if (response.status === 201) {
        setName('');
        onCreate?.();
      } else {
        setErrorMsg(response.data?.message || 'Failed to create category.');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setErrorMsg(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center space-x-4'>
        <div className='relative'>
          <Input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            className='w-[300px] pr-4'
          />
          {errorMsg && (
            <p className='absolute left-0 top-full mt-1 text-red-500 text-sm whitespace-nowrap'>{errorMsg}</p>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={creating} className='rounded-xl'>
          {creating ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
