import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DateRangeProvider } from '@/context/DateRangeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Components
import ReloadTimerPopup from '@/components/ReloadTimerPopup';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NotFoundPage from '@/pages/404Page';
import DatabaseReportPage from '@/pages/DatabaseReportPage';
// Member Management
import ManageMembersPage from '@/pages/member/ManageMembersPage';
import CreateMemberPage from '@/pages/member/CreateMemberPage';
import EditMemberPage from '@/pages/member/EditMemberPage';
import ManageMembershipTypePage from '@/pages/MembershipType/ManageMembershipTypePage';

// Voucher Template
import CreateVoucherTemplatesPage from '@/pages/voucher-template/CreateVoucherTemplatePage';
import ManageVoucherTemplatesPage from '@/pages/voucher-template/ManageVoucherTemplatesPage';
import EditVoucherTemplatePage from '@/pages/voucher-template/EditVoucherTemplatePage';
import ViewVoucherTemplatePage from '@/pages/voucher-template/ViewVoucherTemplatePage';
import ManageVouchersPage from '@/pages/MemberVoucher/ManageVoucherPage';
import CreateMemberVoucherConsumptionPage from '@/pages/MemberVoucher/CreateConsumptionPage';
// Service Management
import ManageServicePage from '@/pages/service/ManageServicePage';
import CreateServicePage from '@/pages/service/CreateServicePage';
import UpdateServicePage from '@/pages/service/UpdateServicePage';
import ReorderServicePage from '@/pages/service/ReorderServicePage';
import ViewSalesHistoryPage from '@/pages/service/ViewSalesHistoryPage';
import ManageServiceCategoryPage from '@/pages/service/ManageServiceCategoryPage';

import MockSalesTransactionPage from '@/pages/sale-transaction/mockSaleTransactionPage';

// Care Package Management
import ManageCarePackagesPage from '@/pages/CarePackages/ManageCarePackagesPage';
import ViewCarePackageDetailsPage from '@/pages/CarePackages/ViewCarePackageDetailsPage';
import CreateCarePackageFormPage from '@/pages/CarePackages/CreateCarePackageFormPage';
import EditCarePackagePage from '@/pages/CarePackages/EditCarePackagePage';
// Member Care Package Management
import ManageMemberCarePackagesPage from './pages/MemberCarePackages/ManageMemberCarePackagesPage';
import ViewMemberCarePackageDetailsPage from '@/pages/MemberCarePackages/ViewMemberCarePackageDetailsPage';
import CreateConsumptionPage from '@/pages/CarePackages/CreateConsumptionPage';
// import CreateMemberCarePackageFormPage from '@/pages/CarePackages/CreateMemberCarePackageFormPage';
// Data Export
import DataExportPage from './pages/miscellaneous/DateExportPage';
import ManagePaymentMethodsPage from './pages/payment-method/ManagePaymentMethodsPage';
import CreatePaymentMethodPage from './pages/payment-method/CreatePaymentMethodPage';
import EditPaymentMethodPage from './pages/payment-method/EditPaymentMethodPage';
import TestPMComponent from './pages/sale-transaction/AddPMMComponentTest';

// Employees
import ManagePositions from '@/pages/em/ManagePositions';

// Refund
import RefundPage from '@/pages/Refund/Refund';
import MCPDetail from '@/pages/Refund/MCPDetail';
import MemberPackagesList from '@/components/refund/MemberPackagesList';
import RefundServicesPage from '@/pages/Refund/RefundServicesPage';
import RefundServiceForm from '@/pages/Refund/RefundServiceForm';
import RefundVouchersPage from '@/pages/Refund/RefundVouchersPage';
import RefundVoucherForm from '@/pages/Refund/RefundVoucherForm';


function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />

              {/* Member Management */}
              <Route path='/member' element={<ManageMembersPage />} />
              <Route path='/member/create' element={<CreateMemberPage />} />
              <Route path='/member/edit/:id' element={<EditMemberPage />} />

              {/* Care Packages Management */}
              <Route path='/cp' element={<ManageCarePackagesPage />} />
              <Route path='/cp/:id' element={<ViewCarePackageDetailsPage />} />
              <Route path='/cp/c' element={<CreateCarePackageFormPage />} />
              <Route path='/cp/:id/edit' element={<EditCarePackagePage />} />

              {/* Member Care Package Management */}
              <Route path='/mcp/:id/consume' element={<CreateConsumptionPage />} />
              <Route path='/mcp' element={<ManageMemberCarePackagesPage />} />
              <Route path='/mcp/:id' element={<ViewMemberCarePackageDetailsPage />} />
              {/* <Route path='/mcp/c' element={<CreateMemberCarePackageFormPage />} /> */}

              {/* Statistics Management */}
              <Route path='/dbcr' element={<DatabaseReportPage />} />

              {/* Employees Routes */}
              <Route path='/positions' element={<ManagePositions />} />

              {/* Service Management */}
              <Route path='/create-service' element={<CreateServicePage />} />
              <Route path='/update-service/:service_id' element={<UpdateServicePage />} />
              <Route path='/reorder-service' element={<ReorderServicePage />} />

              {/* Voucher Template */}
              <Route path='/voucher-template/create' element={<CreateVoucherTemplatesPage />} />
              <Route path='/voucher-template' element={<ManageVoucherTemplatesPage />} />
              <Route path='/voucher-template/edit/:id' element={<EditVoucherTemplatePage />} />
              <Route path='/voucher-template/:id' element={<ViewVoucherTemplatePage />} />
              <Route path='/cart-test' element={<MockSalesTransactionPage />} />

              {/* member vouchers */}
              <Route path='/mv' element={<ManageVouchersPage />} />
              <Route path='/mv/:memberId/consume' element={<CreateMemberVoucherConsumptionPage />} />

              {/* membership-type */}
              <Route path='/membership-type' element={<ManageMembershipTypePage />} />

              {/* data-export */}
              <Route path='/data-export' element={<DataExportPage />} />

              {/* statistics */}
              <Route path='/dbcr' element={<DatabaseReportPage />} />

              {/* Service Management */}
              <Route path='/manage-service' element={<ManageServicePage />} />
              <Route path='/create-service' element={<CreateServicePage />} />
              <Route path='/update-service/:service_id' element={<UpdateServicePage />} />
              <Route path='/reorder-service' element={<ReorderServicePage />} />
              <Route path='/view-sales-history/:service_id' element={<ViewSalesHistoryPage />} />
              <Route path='/manage-service-category' element={<ManageServiceCategoryPage />} />

              {/* Payment Methods Management */}
              <Route path='/payment-method' element={<ManagePaymentMethodsPage />} />
              <Route path='/payment-method/create' element={<CreatePaymentMethodPage />} />
              <Route path='/payment-method/edit/:id' element={<EditPaymentMethodPage />} />
              <Route path='/payment-method/test' element={<TestPMComponent />} />
              <Route path='/create-service' element={<CreateServicePage />} />
              <Route path='/update-service/:service_id' element={<UpdateServicePage />} />
              <Route path='/reorder-service' element={<ReorderServicePage />} />
              <Route path='/view-sales-history/:service_id' element={<ViewSalesHistoryPage />} />
              <Route path='/manage-service-category' element={<ManageServiceCategoryPage />} />

              {/* Refund */}
              <Route path='/refunds' element={<RefundPage />} />
              <Route path='/refunds/member/:memberId' element={<MemberPackagesList />} />
              <Route path="/refunds/mcp/:packageId" element={<MCPDetail />} />
              <Route path="/refunds/services/member/:id" element={<RefundServicesPage />} />
              <Route path="/refunds/services/receipt/:no" element={<RefundServicesPage />} />
              <Route path="/refunds/service/:saleTransactionItemId" element={<RefundServiceForm />} />
              <Route path="/refunds/vouchers/member/:id" element={<RefundVouchersPage />} />
              <Route path="/refunds/voucher/:voucherId" element={<RefundVoucherForm />} />

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
