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

// Appointments Management
import ManageAppointmentsPage from '@/pages/ab/ManageAppointmentsPage';
import CreateAppointmentPage from './pages/ab/CreateAppointmentPage';
import EditAppointmentPage from './pages/ab/EditAppointmentPage.jsx';
import ViewAppointmentDetailsPage from '@/pages/ab/ViewAppointmentDetailsPage.jsx';


function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              {/* Home page */}
              <Route index element={<HomePage />} />

              {/* appointments */}
              <Route path='/appointments' element={<ManageAppointmentsPage />} />
              
              <Route path="/appointments/create" element={<CreateAppointmentPage />} />
              <Route path="/employees" element={<CreateAppointmentPage />} />
              <Route path='/appointments/edit/:id' element={<EditAppointmentPage />} />
              <Route path='/appointments/:id' element={<ViewAppointmentDetailsPage />} />
              
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
