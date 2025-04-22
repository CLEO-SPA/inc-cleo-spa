import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';
import { useAuth } from '@/hooks/useAuth';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('auth/logout');

      logout();

      // Redirect to login page (optional, could be handled by route protection)
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Logout
    </button>
  );
};

export default Logout;
