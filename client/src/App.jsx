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

// Sale Transaction
import MockSalesTransactionPage from '@/pages/sale-transaction/mockSaleTransactionPage';
import SaleTransactionList from '@/pages/sale-transaction/SaleTransactionList';
import SaleTransactionDetail from '@/pages/sale-transaction/SaleTransactionDetail';
import SaleTransactionSummary from '@/pages/sale-transaction/SaleTransactionSummary';
import ProcessPaymentSaleTransaction from '@/pages/sale-transaction/ProcessPaymentSaleTransaction';

import CreateMemberVoucherConsumptionPage from '@/pages/MemberVoucher/CreateConsumptionPage';
// Service Management
import ManageServicePage from '@/pages/service/ManageServicePage';
import CreateServicePage from '@/pages/service/CreateServicePage';
import UpdateServicePage from '@/pages/service/UpdateServicePage';
import ReorderServicePage from '@/pages/service/ReorderServicePage';
import ViewSalesHistoryPage from '@/pages/service/ViewSalesHistoryPage';
import ManageServiceCategoryPage from '@/pages/service/ManageServiceCategoryPage';

// Care Package Management
import ManageCarePackagesPage from '@/pages/CarePackages/ManageCarePackagesPage';
import ViewCarePackageDetailsPage from '@/pages/CarePackages/ViewCarePackageDetailsPage';
import CreateCarePackageFormPage from '@/pages/CarePackages/CreateCarePackageFormPage';
import EditCarePackagePage from '@/pages/CarePackages/EditCarePackagePage';
// Member Care Package Management
import ManageMemberCarePackagesPage from './pages/MemberCarePackages/ManageMemberCarePackagesPage';
import ViewMemberCarePackageDetailsPage from '@/pages/MemberCarePackages/ViewMemberCarePackageDetailsPage';
import CreateMcpConsumptionPage from '@/pages/MemberCarePackages/CreateMcpConsumptionPage';
// import CreateMemberCarePackageFormPage from '@/pages/CarePackages/CreateMemberCarePackageFormPage';
// Data Export
import DataExportPage from './pages/miscellaneous/DateExportPage';
import ManagePaymentMethodsPage from './pages/payment-method/ManagePaymentMethodsPage';
import CreatePaymentMethodPage from './pages/payment-method/CreatePaymentMethodPage';
import EditPaymentMethodPage from './pages/payment-method/EditPaymentMethodPage';
import TestPMComponent from './pages/sale-transaction/AddPMMComponentTest';
import RevenueReportPage from './pages/revenue/RevenueReportPage';
import DeferredRevenuePage from './pages/revenue/DeferredRevenuePage';
// Employees
import ManagePositions from '@/pages/em/ManagePositionsPage';
import CreatePositionPage from '@/pages/em/CreatePositionPage';
import EditPositionPage from '@/pages/em/UpdatePositionPage';
import ManageEmployeesPage from '@/pages/em/ManageEmployeesPage';
import CreateEmployeePage from '@/pages/em/CreateEmployeePage';

// Appointments Management
import ManageAppointmentsPage from '@/pages/ab/ManageAppointmentsPage';
import CreateAppointmentPage from './pages/ab/CreateAppointmentPage';
import EditAppointmentPage from './pages/ab/EditAppointmentPage.jsx';
import ViewAppointmentDetailsPage from '@/pages/ab/ViewAppointmentDetailsPage.jsx';

// Product Management
import ManageProductPage from '@/pages/product/ManageProductPage';
import ManageProductCategoryPage from '@/pages/product/ManageProductCategoryPage';
import ReorderProductPage from '@/pages/product/ReorderProductPage';
import CreateProductPage from '@/pages/product/CreateProductPage';
import UpdateProductPage from '@/pages/product/UpdateProductPage';
import ViewProductSalesHistoryPage from '@/pages/product/ViewProductSalesHistoryPage';

// Add this line with the other page imports (around line 20)
import RefundPage from '@/pages/Refund/refund'; // Add this line
import MCPDetail from '@/pages/Refund/MCPDetail';
import MemberPackagesList from '@/components/refund/MemberPackagesList';

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

              <Route path='/appointments/create' element={<CreateAppointmentPage />} />
              <Route path='/employees' element={<CreateAppointmentPage />} />
              <Route path='/appointments/edit/:id' element={<EditAppointmentPage />} />
              <Route path='/appointments/:id' element={<ViewAppointmentDetailsPage />} />

              {/* Refund */}
              <Route path='/refunds' element={<RefundPage />} />
              <Route path='/refunds/member/:memberId' element={<MemberPackagesList />} />
              <Route path='/refunds/mcp/:packageId' element={<MCPDetail />} />
              {/* Member Management */}
              <Route path='/member' element={<ManageMembersPage />} />
              <Route path='/member/create' element={<CreateMemberPage />} />
              <Route path='/member/edit/:id' element={<EditMemberPage />} />

              {/* Care Packages Management */}
              <Route path='/cp' element={<ManageCarePackagesPage />} />
              <Route path='/cp/:id' element={<ViewCarePackageDetailsPage />} />
              <Route path='/cp/c' element={<CreateCarePackageFormPage />} />
              <Route path='/cp/:memberId/edit' element={<EditCarePackagePage />} />

              {/* Member Care Package Management */}
              <Route path='/mcp/:id/consume' element={<CreateMcpConsumptionPage />} />
              <Route path='/mcp' element={<ManageMemberCarePackagesPage />} />
              <Route path='/mcp/:id' element={<ViewMemberCarePackageDetailsPage />} />
              {/* <Route path='/mcp/c' element={<CreateMemberCarePackageFormPage />} /> */}

              {/* Statistics Management */}
              <Route path='/dbcr' element={<DatabaseReportPage />} />

              {/* Employees Routes */}
              <Route path='/positions' element={<ManagePositions />} />
              <Route path='/positions/create' element={<CreatePositionPage />} />
              <Route path='/positions/update/:id' element={<EditPositionPage />} />
              <Route path='/employees' element={<ManageEmployeesPage />} />
              <Route path='/employees/create' element={<CreateEmployeePage />} />

              {/* Voucher Template */}
              <Route path='/voucher-template/create' element={<CreateVoucherTemplatesPage />} />
              <Route path='/voucher-template' element={<ManageVoucherTemplatesPage />} />
              <Route path='/voucher-template/edit/:id' element={<EditVoucherTemplatePage />} />
              <Route path='/voucher-template/:id' element={<ViewVoucherTemplatePage />} />

              {/* Sales Transactions */}
              <Route path='/cart-test' element={<MockSalesTransactionPage />} />
              <Route path='/sale-transaction/list' element={<SaleTransactionList />} />
              <Route path='/sale-transaction/:id' element={<SaleTransactionDetail />} />
              <Route path='/sale-transaction/summary' element={<SaleTransactionSummary />} />
              <Route path='/sale-transaction/process-payment/:id' element={<ProcessPaymentSaleTransaction />} />

              <Route path='/mcp/:packageId/consume' element={<CreateMcpConsumptionPage />} />

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

              {/* Product Management */}
              <Route path='/manage-product' element={<ManageProductPage />} />
              <Route path='/create-product' element={<CreateProductPage />} />
              <Route path='/update-product/:product_id' element={<UpdateProductPage />} />
              <Route path='/reorder-product' element={<ReorderProductPage />} />
              <Route path='/manage-product-category' element={<ManageProductCategoryPage />} />
              <Route path='/view-product-sales-history/:product_id' element={<ViewProductSalesHistoryPage />} />

              {/* Revenue Report Page */}
              <Route path='/rr' element={<RevenueReportPage />} />
              {/* Deferred Revenue Page */}
              <Route path='/dr' element={<DeferredRevenuePage />} />
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
