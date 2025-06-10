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
import EmployeeTimetablePage from './pages/EmployeeTimetable/EmployeeTimetabel';

// Employee Timetable Pages
import CreateEmployeeTimetablePage from '@/pages/EmployeeTimetable/CreateEmployeeTimetablePage'

function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
              {/* employee timetable */}
              <Route path='/et/create-employee-timetable' element={<CreateEmployeeTimetablePage />} />
            </Route>
            <Route path='/login' element={<LoginPage />} />

            {/* Invitation & Reset Password */}
            <Route path='/invites' element={<ResetPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />

            {/* 404 Page */}
            <Route path='*' element={<NotFoundPage />} />
            <Route path='/tt' element={<EmployeeTimetablePage />} />
          </Routes>
        </Router>
      </DateRangeProvider>
    </AuthProvider>
  );
}

export default App;
