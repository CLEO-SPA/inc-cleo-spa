import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // First check authentication
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Then check roles if specified
  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to='/unauthorized' replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
