import React, { useContext } from 'react';
import AuthContext from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleTest = () => {
  const { user, isLoading, hasRole } = useContext(AuthContext);
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!hasRole('super_admin')) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <div className="role-test-container">
      <h1>Super Admin Access</h1>
      <p>Welcome, {user?.username}!</p>
      
      <div className="role-info">
        <h2>Your Information</h2>
        <p><strong>User ID:</strong> {user?.user_id}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Primary Role:</strong> {user?.role}</p>
      </div>
      
      <div className="role-list">
        <h2>Your Roles:</h2>
        {user?.roles && user.roles.length > 0 ? (
          <ul>
            {user.roles.map((role, index) => (
              <li key={index}>{role}</li>
            ))}
          </ul>
        ) : (
          <p>No roles assigned</p>
        )}
      </div>
      
      <div className="admin-actions">
        <h2>Admin Actions</h2>
        <button className="btn">Manage Users</button>
        <button className="btn">System Settings</button>
        <button className="btn">Audit Logs</button>
      </div>
    </div>
  );
};

export default RoleTest;