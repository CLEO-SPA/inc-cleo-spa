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
import ManageServicePage from '@/pages/ManageServicePage';
import MockSalesTransactionPage from './pages/sale-transaction/mockSaleTransactionPage';
import ManageVouchersPage from './pages/MemberVoucher/ManageVoucherPage';
import DatabaseReportPage from '@/pages/DatabaseReportPage';
import CreateConsumptionPage from '@/pages/CarePackages/CreateConsumptionPage';
import CreateMemberVoucherConsumptionPage from '@/pages/MemberVoucher/CreateConsumptionPage';
// Data Export
import DataExportPage from './pages/miscellaneous/DateExportPage';
// Product Management
import ManageProductPage from '@/pages/product/ManageProductPage';
import ManageProductCategoryPage from '@/pages/product/ManageProductCategoryPage';
import ReorderProductPage from '@/pages/product/ReorderProductPage';
import CreateProductPage from '@/pages/product/CreateProductPage';
import UpdateProductPage from '@/pages/product/UpdateProductPage';
import ViewProductSalesHistoryPage from '@/pages/product/ViewProductSalesHistoryPage';

function App() {
  return (
    <AuthProvider>
      <ReloadTimerPopup />
      <DateRangeProvider>
        <Router>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />

              {/* care packages */}
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
              <Route path='/cart-test' element={<MockSalesTransactionPage />} />

              <Route path='/mcp/:packageId/consume' element={<CreateConsumptionPage />} />

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

               {/* Product Management */}
              <Route path='/manage-product' element={<ManageProductPage />} />
              <Route path='/create-product' element={<CreateProductPage />} />
              <Route path='/update-product/:product_id' element={<UpdateProductPage />} />
              <Route path='/reorder-product' element={<ReorderProductPage />} />
              <Route path='/manage-product-category' element={<ManageProductCategoryPage />} />
              <Route path='/view-product-sales-history/:product_id' element={<ViewProductSalesHistoryPage />} />
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
