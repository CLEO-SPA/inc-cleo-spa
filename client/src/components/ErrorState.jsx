import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ErrorState = ({ error, title = 'Error', onGoBack = () => window.history.back() }) => {
  return (
    <div className='flex items-center justify-center h-full'>
      <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md w-full'>
        <div className='flex items-center space-x-3 mb-4'>
          <AlertCircle className='w-5 h-5 text-red-500' />
          <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
        </div>
        <p className='text-gray-600 mb-4'>{error}</p>
        <Button onClick={onGoBack} variant='outline' className='flex items-center w-full justify-center'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Go Back
        </Button>
      </div>
    </div>
  );
};
