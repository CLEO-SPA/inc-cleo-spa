import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound } from 'lucide-react'; // Lucide icon
import api from '@/services/api';

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromQuery = queryParams.get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    } else {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Basic password strength check (optional, enhance as needed)
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!token) {
      setError('Missing reset token. Cannot proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(`/employees/invites?token=${token}`, {
        password: newPassword,
      });

      const data = await response.data;

      if (response.data) {
        setSuccessMessage('Password has been reset successfully! You can now log in with your new password.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. The link may have expired or an error occurred.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

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
        <CardContent>
          {successMessage ? (
            <div className='text-center'>
              <p className='text-green-600'>{successMessage}</p>
              <Button onClick={() => navigate('/login')} className='mt-4'>
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-6'>
              {!token && error && <p className='text-sm text-destructive text-center'>{error}</p>}
              {token && (
                <>
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
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                </>
              )}
              {error && <p className='text-sm text-destructive text-center'>{error}</p>}
              {token && (
                <Button type='submit' disabled={isSubmitting || !token} className='w-full'>
                  {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
