import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react'; // Or any other icon you prefer

const ReloadTimerPopup = () => {
  const { showReloadTimer, timerSeconds } = useAuth();

  if (!showReloadTimer) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px', // Adjust as needed
        right: '20px', // Adjust as needed
        zIndex: 1050, // Ensure it's on top of other elements
        minWidth: '350px', // Adjust as needed
        maxWidth: '90%',
      }}
    >
      <Alert variant='destructive'>
        {' '}
        {/* Or use default variant */}
        <InfoIcon className='h-4 w-4' />
        <AlertTitle>System Update Detected!</AlertTitle>
        <AlertDescription>
          The application will automatically reload in:
          <span style={{ fontWeight: 'bold', fontSize: '1.25em', marginLeft: '8px', color: 'inherit' }}>
            {timerSeconds}
          </span>{' '}
          seconds.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReloadTimerPopup;
