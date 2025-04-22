import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuPackage,
  LuClipboardCheck,
  LuCreditCard,
  LuUserCog,
  LuClipboardList,
  LuBell,
  LuMapPin,
  LuBuilding,
} from 'react-icons/lu';
import Navbar from '@/components/Navbar';
import { api } from '@/interceptors/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import MemberCarePackageDetails from '../pages/member-care-package-management/MemberCarePackageDetails';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const ErrorDisplay = ({ message, isOpen, onClose }) => (
  <DialogRoot open={isOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-red-600">Error</DialogTitle>
        <DialogCloseTrigger onClick={onClose} />
      </DialogHeader>
      <DialogBody>
        <p className="text-gray-700">Error loading dashboard: {message}</p>
      </DialogBody>
    </DialogContent>
  </DialogRoot>
);

const StatCard = ({ icon: Icon, title, value, description, isLoading }) => (
  <Card className={`bg-white border border-gray-200 ${isLoading ? 'opacity-75' : ''}`}>
    <CardHeader>
      <CardTitle className="text-lg flex items-center text-gray-900 gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-gray-900">{isLoading ? '-' : value}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </CardContent>
  </Card>
);

const QuickActionButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center px-6 py-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <Icon className="h-6 w-6 text-gray-600" />
    <span className="ml-4 text-gray-700">{label}</span>
  </button>
);

// care package card
const CarePackageCard = ({ package_, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
        {package_.care_package_name}
      </h3>
    </div>
    <p className="text-sm text-gray-500">Member: {package_.cs_members?.member_name || 'Unknown Member'}</p>
  </button>
);

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/em/cli', {
          signal: controller.signal,
        });

        // console.log(response.data);
        setEmployeeData(response.data);
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
          setIsErrorDialogOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    return () => controller.abort();
  }, []);

  // calculating invoice and commission
  const calculateFinancials = (data) => {
    if (!data?.cs_invoices?.length) return { totalInvoiceAmount: 0, commissionAmount: 0 };

    const totalInvoiceAmount = data.cs_invoices.reduce(
      (sum, invoice) => sum + (parseFloat(invoice.total_invoice_amount) || 0),
      0
    );

    const commissionAmount = totalInvoiceAmount * (parseFloat(data.commission_percentage || 0) / 100);

    return { totalInvoiceAmount, commissionAmount };
  };

  // get top 3 most recent member care packages
  const getFilteredCarePackages = () => {
    if (!employeeData?.cs_member_care_package) {
      return [];
    }

    return employeeData.cs_member_care_package;
  };

  const handleCarePackageClick = async (package_) => {
    try {
      const response = await api.get(`/mcp/get-mcp/${package_.member_care_package_id}`);
      setSelectedPackage(response.data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error('Error fetching package details:', err);
      setError('Failed to load package details');
      setIsErrorDialogOpen(true);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!employeeData) return null;

  const handleErrorClose = () => {
    setIsErrorDialogOpen(false);
    setError(null);
  };

  // console.log(employeeData);

  const { totalInvoiceAmount, commissionAmount } = calculateFinancials(employeeData);
  const filteredCarePackages = getFilteredCarePackages();

  return (
    <div className="min-h-screen bg-gray-50">
      {error && <ErrorDisplay message={error} isOpen={isErrorDialogOpen} onClose={handleErrorClose} />}

      {/* member care package details */}
      <MemberCarePackageDetails
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPackage(null);
        }}
        selectedPackage={selectedPackage}
      />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* user info */}
        <Card className="mb-12">
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">{employeeData.employee_name}</h1>
                  <div className="text-lg text-gray-600">{employeeData.cs_position.position_name}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <LuBuilding className="h-5 w-5 mr-3" />
                    <span>{employeeData.cs_department.department_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={LuPackage}
            title="Care Packages"
            value={filteredCarePackages.length}
            description="Active packages"
            isLoading={isLoading}
          />
          <StatCard
            icon={LuClipboardCheck}
            title="Active Invoices"
            value={employeeData.cs_invoices.length}
            description="Total invoices this period"
            isLoading={isLoading}
          />
          <StatCard
            icon={LuCreditCard}
            title="Total Sales"
            value={`${totalInvoiceAmount.toLocaleString()}`}
            description="Current period revenue"
            isLoading={isLoading}
          />
          <StatCard
            icon={LuUserCog}
            title="Total Commission"
            value={`$${commissionAmount.toLocaleString()}`}
            description="Based on current sales"
            isLoading={isLoading}
          />
        </div>

        {/* action grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <QuickActionButton
                  icon={LuPackage}
                  label={`Manage Care Packages (${filteredCarePackages.length})`}
                  onClick={() => navigate('/cpd')}
                />
                <QuickActionButton
                  icon={LuClipboardList}
                  label={`View Invoices (${employeeData.cs_invoices.length})`}
                  onClick={() => navigate('/invoices')}
                />
                <QuickActionButton
                  icon={LuClipboardCheck}
                  label="View Package Transactions"
                  onClick={() => navigate('/transactions')}
                />
                <QuickActionButton
                  icon={LuBell}
                  label="Send Customer Notifications"
                  onClick={() => navigate('/notifications')}
                />
                <QuickActionButton icon={LuClipboardList} label="View Audit Logs" onClick={() => navigate('/al')} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Recent Care Packages</CardTitle>
                <button
                  onClick={() => navigate('/mcpd')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </CardHeader>
              <CardContent>
                {
                  <div className="space-y-4">
                    {filteredCarePackages.length > 0 ? (
                      filteredCarePackages
                        .slice(0, 3)
                        .map((package_) => (
                          <CarePackageCard
                            key={package_.member_care_package_id}
                            package_={package_}
                            onClick={() => handleCarePackageClick(package_)}
                          />
                        ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No care packages available</p>
                    )}
                  </div>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
