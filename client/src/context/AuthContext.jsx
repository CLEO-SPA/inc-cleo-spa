import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/status');
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.response && error.response.status !== 401) {
        console.error('AuthContext: Failed to check auth status:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const handleAuthError = () => {
      console.log('AuthContext: Received Error 401. Logging out.');
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-error-401', handleAuthError);

    return () => {
      window.removeEventListener('auth-error-401', handleAuthError);
    };
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // console.log('AuthContext: Login response:', response.data);

      if (response.data && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('AuthContext: Login failed:', error.response?.data?.message || error.message);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/auth/logout');
    } catch (error) {
      console.error('AuthContext: Logout API call failed:', error.response?.data?.message || error.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * Check if the current user has one of the specified roles
   * @param {string|string[]} requiredRoles - Single role or array of roles
   * @returns {boolean} - True if user has one of the required roles
   */
  const hasRole = useCallback((requiredRoles) => {
    if (!isAuthenticated || !user || !user.roles) {
      return false;
    }
    
    // Convert required roles to array if it's a string
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has at least one of the required roles
    return roles.some(role => user.roles.includes(role));
  }, [isAuthenticated, user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout, 
        checkAuthStatus,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
