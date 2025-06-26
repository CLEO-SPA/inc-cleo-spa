import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='flex flex-col items-center space-y-4'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-600' />
        <p className='text-gray-600 font-medium'>{message}</p>
      </div>
    </div>
  );
};
