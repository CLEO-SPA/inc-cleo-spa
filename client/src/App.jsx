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
import ManageMembershipTypePage from '@/pages/MembershipType/ManageMembershipTypePage';
// Member Management
import ManageMembersPage from './pages/member/ManageMembersPage';
import CreateMemberPage from './pages/member/CreateMemberPage';
import EditMemberPage from './pages/member/EditMemberPage';

import ManageCarePackagesPage from '@/pages/CarePackages/ManageCarePackagesPage';
import ViewCarePackageDetailsPage from '@/pages/CarePackages/ViewCarePackageDetailsPage';
import CreateCarePackageFormPage from '@/pages/CarePackages/CreateCarePackageFormPage';
import EditCarePackagePage from './pages/CarePackages/EditCarePackagePage';


// import CreateMemberCarePackageFormPage from '@/pages/CarePackages/CreateMemberCarePackageFormPage';
// Voucher Template
import CreateVoucherTemplatesPage from './pages/voucher-template/CreateVoucherTemplatePage';
import ManageVoucherTemplatesPage from './pages/voucher-template/ManageVoucherTemplatesPage';
import EditVouhcerTemplatePage from './pages/voucher-template/EditVoucherTemplatePage';

import MockSalesTransactionPage from './pages/sale-transaction/mockSaleTransactionPage';

import ManageVouchersPage from './pages/MemberVoucher/ManageVoucherPage';
import DatabaseReportPage from '@/pages/DatabaseReportPage';
import CreateConsumptionPage from '@/pages/CarePackages/CreateConsumptionPage';
import CreateMemberVoucherConsumptionPage from '@/pages/MemberVoucher/CreateConsumptionPage';

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

              {/* care packages */}
              <Route path='/cp' element={<ManageCarePackagesPage />} />
              <Route path='/cp/:id' element={<ViewCarePackageDetailsPage />} />
              <Route path='/cp/c' element={<CreateCarePackageFormPage />} />
              <Route path='/cp/:id/edit' element={<EditCarePackagePage />} />

              {/* member care package */}
              <Route path='/mcp/:id/consume' element={<CreateConsumptionPage />} />
              {/* <Route path='/mcp/c' element={<CreateMemberCarePackageFormPage />} /> */}
              <Route path='/member/:id' element={<EditMemberPage />} />
              {/* Voucher Template */}
              <Route path='/voucher-template/create' element={<CreateVoucherTemplatesPage />} />
              <Route path='/voucher-template' element={<ManageVoucherTemplatesPage />} />
              <Route path='/voucher-template/edit/:id' element={<EditVouhcerTemplatePage />} />
              <Route path='/cart-test' element={<MockSalesTransactionPage />} />

              <Route path='/mcp/:packageId/consume' element={<CreateConsumptionPage />} />

              {/* member vouchers */}
              <Route path='/mv' element={<ManageVouchersPage />} />
              <Route path='/mv/:memberId/consume' element={<CreateMemberVoucherConsumptionPage />} />

              {/* membership-type */}
              <Route path='/membership-type' element={<ManageMembershipTypePage />} />

              {/* statistics */}
              <Route path='/dbcr' element={<DatabaseReportPage />} />

              {/* Service Management */}
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
