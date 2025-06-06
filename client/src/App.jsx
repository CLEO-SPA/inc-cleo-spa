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
import ManageServicePage from '@/pages/ManageServicePage'
import CreateServicePage from '@/pages/CreateServicePage';
import UpdateServicePage from '@/pages/UpdateServicePage';
import ReorderServicePage from '@/pages/ReorderServicePage';

function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />              
              
              {/* Service Management */}
            <Route path='/manage-service' element={<ManageServicePage />} />
            <Route path='/create-service' element={<CreateServicePage />} />
            <Route path='/update-service/:service_id' element={<UpdateServicePage />} />
            <Route path='/reorder-service' element={<ReorderServicePage />} />

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
