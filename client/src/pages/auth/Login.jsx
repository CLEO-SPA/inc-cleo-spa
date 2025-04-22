import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/interceptors/axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.status === 200 && response.data.user) {
        login(response.data.user);
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed. Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='username'>Username:</label>
          <input type='text' id='username' value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label htmlFor='password'>Password:</label>
          <input
            type='password'
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type='submit'>Login</button>
      </form>
    </div>
  );
};

export default Login;
