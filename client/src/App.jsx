import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DateRangeProvider } from '@/context/DateRangeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NotFoundPage from '@/pages/404Page';
import RoleTest from '@/pages/roleTest';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

function App() {
  return (
    <AuthProvider>
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
            </Route>
            
            {/* Role-protected route */}
            <Route path='/role-test' element={<ProtectedRoute requiredRoles="super_admin" />}>
              <Route index element={<RoleTest />} />
            </Route>
            
            <Route path='/login' element={<LoginPage />} />
            <Route path='/unauthorized' element={<UnauthorizedPage />} />

            {/* Invitation & Reset Password */}
            <Route path='/invites' element={<ResetPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />

            {/* 404 Page */}
            <Route path='*' element={<NotFoundPage />} />
          </Routes>
        </Router>
      </DateRangeProvider>
    </AuthProvider>
  );
}

export default App;
