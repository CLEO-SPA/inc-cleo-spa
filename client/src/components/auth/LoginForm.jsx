import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../interceptors/axios';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { Input } from '@chakra-ui/react';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogCloseTrigger } from '../ui/dialog';

const LoginForm = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        employeeCode,
        password,
      });

      login(response.data.user || { id: response.data.userId });
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg bg-zinc-100">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p>Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Employee Code">
          <Input
            type="text"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="Enter your employee code"
            required
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </Field>

        <DialogRoot open={!!error} onOpenChange={() => setError('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <p className="text-red-400">{error}</p>
            </DialogBody>
          </DialogContent>
        </DialogRoot>

        <Button type="submit" className="w-full bg-zinc-400 hover:bg-green-300" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
