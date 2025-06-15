import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DateRangeProvider } from '@/context/DateRangeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Components
import ReloadTimerPopup from './components/ReloadTimerPopup';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NotFoundPage from '@/pages/404Page';

// Employees
import ManagePositions from '@/pages/em/ManagePositionsPage';
import CreatePositionPage from '@/pages/em/CreatePositionPage';
import EditPositionPage from '@/pages/em/UpdatePositionPage';
import ManageEmployeesPage from '@/pages/em/ManageEmployeesPage';


function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
              {/* Employees Routes */}
              <Route path='/positions' element={<ManagePositions />} />
              <Route path='/positions/create' element={<CreatePositionPage />} />
              <Route path='/positions/update/:id' element={<EditPositionPage />} />
              <Route path='/employees' element={<ManageEmployeesPage />} />

              {/* Protected Routes */}

            </Route>
            <Route path='/login' element={<LoginPage />} />

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
