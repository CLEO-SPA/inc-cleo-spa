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
import ManageMembershipTypePage from '@/pages/membership-type/ManageMembershipTypePage';
import ManageCarePackagesPage from './pages/CarePackages/ManageCarePackagesPage';
// Member Management
import ManageMembersPage from './pages/member/ManageMembersPage';
import CreateMemberPage from './pages/member/CreateMemberPage';
import EditMemberPage from './pages/member/EditMemberPage';
// Voucher Template
import CreateVoucherTemplatesPage from './pages/voucher-template/CreateVoucherTemplatePage';
import ManageVoucherTemplatesPage from './pages/voucher-template/ManageVoucherTemplatesPage';
import EditVouhcerTemplatePage from './pages/voucher-template/EditVoucherTemplatePage';
// Service Management
import ManageServicePage from '@/pages/ManageServicePage'

function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
              <Route path='/mcp' element={<ManageCarePackagesPage />} />
              {/* Member Management */}
              <Route path='/member' element={<ManageMembersPage />} />
              <Route path='/member/create' element={<CreateMemberPage />} />
              <Route path='/member/edit/:id' element={<EditMemberPage />} />
              <Route path='/member/:id' element={<EditMemberPage />} />
              {/* Voucher Template */}
              <Route path='/voucher-template/create' element={<CreateVoucherTemplatesPage />} />
              <Route path='/voucher-template' element={<ManageVoucherTemplatesPage />} />
              <Route path='/voucher-template/edit/:id' element={<EditVouhcerTemplatePage />} />
            </Route>
            <Route path='/login' element={<LoginPage />} />


            {/* Invitation & Reset Password */}
            <Route path='/invites' element={<ResetPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            
            <Route path='/membership-type' element={<ManageMembershipTypePage/>} />
            {/* 404 Page */}
            <Route path='*' element={<NotFoundPage />} />

            {/* Service Management */}
            <Route path='/manage-service' element={<ManageServicePage />} />          </Routes>
        </Router>
      </DateRangeProvider>
    </AuthProvider>
  );
}

export default App;
