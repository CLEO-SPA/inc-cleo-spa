import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/context/RouteProtectionContext';
import { TranslationProvider } from '@/context/TranslationContext'; // Import TranslationProvider

import { ItemContextProvider } from '@/context/ItemContext';

// Pages
import HomePage from '@/pages/Home.jsx';
import Login from '@/pages/auth/Login.jsx';

import RevenueReport from '@/pages/revenue/RevenueReport.jsx';

// Care Package Management
import CarePackageDashboard from '@/pages/care-package-management/CarePackageDashboard.jsx';
import CarePackageForm from '@/pages/care-package-management/CarePackageForm.jsx';
import MemberCarePackageDashboard from '@/pages/member-care-package-management/MemberCarePackageDashboard';
import MemberCarePackageForm from '@/pages/member-care-package-management/MemberCarePackageForm';
import CreateMember from '@/pages/membership/CreateMemberForm';
import MemberCarePackageConsumption from '@/pages/member-care-package-management/MemberCarePackageConsumption';
import MemberCarePackageEditForm from '@/pages/member-care-package-management/MemberCarePackageEditForm';

// Invoice Management
import CreateInvoice from '@/pages/dashboard/CreateInvoice.jsx';
import InvoiceSummary from '@/pages/dashboard/InvoiceSummary';
import InvoicePayment from '@/pages/dashboard/InvoicePaymentPage';
import InvoiceListPage from '@/pages/dashboard/InvoiceListPage';
import InvoiceDetailPage from '@/pages/dashboard/InvoiceDetailPage';
import EditInvoice from '@/components/editInvoice/EditInvoice';

// Service Management
import CreateService from '@/pages/service-management/CreateService.jsx';
import ServiceManagement from '@/pages/service-management/ServiceManagement.jsx';
import UpdateService from '@/pages/service-management/UpdateService.jsx';
import ServiceSalesHistory from '@/pages/service-management/ServiceSalesHistory';

import UpdateServiceSequence from '@/pages/service-management/UpdateServiceSequence';
import ServiceDailyBreakdownSalesHistory from '@/pages/service-management/ServiceDailyBreakdownSalesHistory';
import ServiceStatistics from '@/pages/service-management/ServiceStatistics';
import AdHocServiceRevenue from '@/pages/service/ServiceRevenue';

// Product Management
import ProductManagement from '@/pages/product-management/ProductManagement.jsx';
import UpdateProduct from '@/pages/product-management/UpdateProduct.jsx';
import CreateProduct from '@/pages/product-management/CreateProduct.jsx';
import ProductRevenue from '@/pages/product-management/ProductRevenue';
import ProductSalesHistory from '@/pages/product-management/ProductSalesHistory';
import ProductDailyBreakdownSalesHistory from '@/pages/product-management/ProductDailyBreakdownSalesHistory';
import ProductStatistics from '@/pages/product-management/ProductStatistics';

// Employee Management
import CreateDepartment from '@/pages/employee-managment/CreateDepartment';
import Departments from '@/pages/employee-managment/Departments';
import CreateEmployee from '@/pages/employee-managment/CreateEmployee';
import Employees from '@/pages/employee-managment/Employees';
import Positions from '@/pages/employee-managment/Positions';
import EmployeePerformanceReport from '@/components/employee_management/EmployeePerformance';
import EmployeePerformanceBreakdown from '@/components/employee_management/EmployeePerformanceBreakdown';

// Credit Note
import EditCreditNote from '@/pages/refund/EditCreditNote';
import ViewCreditNotesIssued from '@/pages/refund/ViewCreditNotes';
import ViewCreditNote from '@/pages/refund/ViewIndividualCreditNote';

// Daily membership account sales
import DailyMembershipAccountPage from '@/pages/membership-account-sales/dailyAccountSales';
import RecordMembershipAccount from '@/pages/membership/recordMembershipAccount';
import MembershipType from '@/pages/membership/membershipType';
import MonthlyMembershipRevenue from '@/pages/revenue/MonthlyMembershipRevenue.jsx';

// Transaction and Refund Logs
import TransactionLogsDashboard from '@/pages/transaction-logs/TransactionLogsDashboard';
import TransactionForm from '@/pages/transaction-logs/TransactionForm';
import RefundForm from '@/pages/refund/RefundForm';

// Payment Method Management
import CreatePaymentMethod from '@/pages/payment-method-management/CreatePaymentMethod';
import PaymentMethodManagement from '@/pages/payment-method-management/PaymentMethodManagement';

// 404
import NotFoundPage from '@/pages/404';

// Translation Form
import TranslationForm from '@/pages/translation/translation';

import CustomerFollowups from '@/pages/customer/CustomerFollowUps';
// Miscellaneous
import ExportData from '@/pages/misc/ExportData';
import AuditLogsDashboard from '@/pages/audit-logs/AuditLogDashboard';

import ExportDataContinuation from '@/pages/misc/ExportData2';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route element={<ProtectedRoute />}>
          {/* Invoice-related routes wrapped with ItemContextProvider */}
          <Route
            path='/ci'
            element={
              <ItemContextProvider>
                <CreateInvoice />
              </ItemContextProvider>
            }
          />
          <Route
            path='/cip'
            element={
              <ItemContextProvider>
                <InvoiceSummary />
              </ItemContextProvider>
            }
          />
          <Route
            path='/ci/edit/:id'
            element={
              <ItemContextProvider>
                <EditInvoice />
              </ItemContextProvider>
            }
          />
          <Route
            path='/invoices/payment/:invoiceId'
            element={
              <ItemContextProvider>
                <InvoicePayment />
              </ItemContextProvider>
            }
          />

          {/* Regular routes */}
          <Route path='/' element={<HomePage />} />

          <Route path='/invoices/' element={<InvoiceListPage />} />
          <Route path='/invoices/:id' element={<InvoiceDetailPage />} />

          {/* Care Package Management */}
          <Route path='/cpd' element={<CarePackageDashboard />} />
          <Route path='/cpf' element={<CarePackageForm />} />

          {/* Member Care Package Management */}
          <Route path='/mcp/:id/consumption' element={<MemberCarePackageConsumption />} />
          <Route path='/mcp/:id/edit' element={<MemberCarePackageEditForm />} />
          <Route path='/mcpd' element={<MemberCarePackageDashboard />} />
          <Route path='/mcpf' element={<MemberCarePackageForm />} />

          {/* Employee Management */}
          <Route path='/createDepartment' element={<CreateDepartment />} />
          <Route path='/departments' element={<Departments />} />
          <Route path='/createEmployee' element={<CreateEmployee />} />
          <Route path='/employees' element={<Employees />} />
          <Route path='/membershiptype' element={<MembershipType />} />
          <Route path='/positions' element={<Positions />} />
          <Route path='/empr/:employeeId' element={<EmployeePerformanceReport />} />
          <Route path='/empr/:employeeId/:month/:year/:day' element={<EmployeePerformanceBreakdown />} />

          {/* Service Management */}
          <Route path='/sc' element={<CreateService />} />
          <Route path='/sm' element={<ServiceManagement />} />
          <Route path='/su/:id' element={<UpdateService />} />
          <Route path='/ssq' element={<UpdateServiceSequence />} />
          <Route path='/sh/:service_name' element={<ServiceSalesHistory />} />
          <Route path='/sh/db/:service_name/:date' element={<ServiceDailyBreakdownSalesHistory />} />
          <Route path='/service/revenue' element={<AdHocServiceRevenue />} />
          <Route path='/ssr' element={<ServiceStatistics />} />

          {/* Payment Method Management */}
          <Route path='/cpm' element={<CreatePaymentMethod />} />
          <Route path='/pmm' element={<PaymentMethodManagement />} />

          {/* Product Management */}
          <Route path='/pdc' element={<CreateProduct />} />
          <Route path='/pdm' element={<ProductManagement />} />
          <Route path='/pdu/:id' element={<UpdateProduct />} />
          <Route path='/psh/:product_name' element={<ProductSalesHistory />} />
          <Route path='/psh/db/:product_name/:date' element={<ProductDailyBreakdownSalesHistory />} />
          <Route path='/psr' element={<ProductStatistics />} />
          <Route path='/product/revenue' element={<ProductRevenue />} />
          <Route path='/customer/followups' element={<CustomerFollowups />} />

          <Route path='/transactions' element={<TransactionLogsDashboard />} />
          <Route path='/transactions/create' element={<TransactionForm />} />
          <Route path='/transactions/refund' element={<RefundForm />} />

          {/* Member Management */}
          <Route path='/cm' element={<CreateMember />} />

          <Route path='/finance/creditNote' element={<ViewCreditNotesIssued />} />
          <Route path='/finance/credit-notes/view/:cnid' element={<ViewCreditNote />} />
          <Route path='/finance/edit-credit-note/:cnid' element={<EditCreditNote />} />

          <Route
            path='/da/ma'
            element={
              <TranslationProvider>
                <DailyMembershipAccountPage />
              </TranslationProvider>
            }
          />
          <Route path='/ma/mr' element={<RecordMembershipAccount />} />

          <Route
            path='/tl'
            element={
              <TranslationProvider>
                <TranslationForm />
              </TranslationProvider>
            }
          />

          <Route path='/ci/edit/:id' element={<EditInvoice />} />
          {/* <Route path="/finance/edit-credit-note/:cnid" element={<EditCreditNote />} /> */}

          {/* Refund System */}
          <Route path='/finance/refund' element={<RefundForm />} />
          <Route path='/finance/revenue' element={<RevenueReport />} />
          {/* Export Data */}
          <Route path='/misc/ed' element={<ExportData />} />
          <Route path='/misc/edc' element={<ExportDataContinuation />} />

          <Route path='/mMembershipRevenue' element={<MonthlyMembershipRevenue />} />

          {/* Audit Logs */}
          <Route path='/al' element={<AuditLogsDashboard />} />
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
