import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import useResetPasswordStore from '@/stores/useResetPasswordStore';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    newPassword,
    confirmPassword,
    error,
    successMessage,
    isSubmitting,
    isVerifying,
    isTokenValid,
    setField,
    verifyToken,
    resetPassword,
    reset,
  } = useResetPasswordStore();

  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromQuery = queryParams.get('token');
    setField('token', tokenFromQuery);
    verifyToken();

    return () => {
      reset();
    };
  }, [location.search, setField, verifyToken, reset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await resetPassword(navigate);
  };

  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className='flex flex-col items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='mt-4 text-muted-foreground'>Verifying your invitation link...</p>
        </div>
      );
    }

    if (successMessage) {
      return (
        <div className='text-center'>
          <p className='text-green-600'>{successMessage}</p>
          <Button onClick={() => navigate('/login')} className='mt-4'>
            Go to Login
          </Button>
        </div>
      );
    }

    if (!isTokenValid) {
      return <p className='text-sm text-destructive text-center'>{error}</p>;
    }

    return (
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='newPassword'>New Password</Label>
          <div className='relative'>
            <Input
              id='newPassword'
              name='newPassword'
              type={showNewPassword ? 'text' : 'password'}
              placeholder='Enter new password'
              required
              value={newPassword}
              onChange={(e) => setField('newPassword', e.target.value)}
              className={error.includes('password') || error.includes('match') ? 'border-destructive' : ''}
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={toggleShowNewPassword}
            >
              {showNewPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </Button>
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder='Re-enter new password'
              required
              value={confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              className={error.includes('match') ? 'border-destructive' : ''}
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={toggleShowConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </Button>
          </div>
        </div>
        {error && <p className='text-sm text-destructive text-center'>{error}</p>}
        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    );
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-background'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1 text-center'>
          <div className='flex justify-center mb-4'>
            <KeyRound className='h-10 w-10 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
