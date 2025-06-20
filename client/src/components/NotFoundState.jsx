import React from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundState = ({
  title = 'Not Found',
  message = "The item you're looking for doesn't exist or has been removed.",
  onGoBack = () => window.history.back(),
}) => {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto text-center'>
        <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h2>
        <p className='text-gray-600 mb-4'>{message}</p>
        <Button onClick={onGoBack} variant='outline' className='flex items-center mx-auto'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Go Back
        </Button>
      </div>
    </div>
  );
};
