import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock } from 'lucide-react'; // Lucide icon
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Add state for rememberMe
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const success = await login({ username, password, rememberMe }); // Pass rememberMe
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-background'>
      <Card className='w-full max-w-sm'>
        <CardHeader className='space-y-1 text-center'>
          <div className='flex justify-center mb-4'>
            <Avatar>
              {/* <AvatarImage src="/placeholder-avatar.jpg" alt="Lock" /> */}
              <AvatarFallback>
                <Lock className='h-6 w-6' />
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className='text-2xl font-bold'>Sign In</CardTitle>
          <CardDescription>Enter your email or mobile number and password to login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Email or Username</Label>
              <Input
                id='username'
                name='username'
                type='text'
                placeholder='you@example.com or you_123'
                required
                autoComplete='username'
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='********'
                required
                autoComplete='current-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox id='rememberMe' checked={rememberMe} onCheckedChange={setRememberMe} />
              <Label
                htmlFor='rememberMe'
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Remember me
              </Label>
            </div>
            {error && <p className='text-sm text-destructive text-center'>{error}</p>}
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
