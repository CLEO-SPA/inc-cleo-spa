import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuPackagePlus, LuCreditCard, LuCalendar, LuPackageX } from 'react-icons/lu';
import { Eye, Edit2, ArrowUpDown, FilePenLine } from 'lucide-react';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import MemberCarePackageDetails from './MemberCarePackageDetails';
import EditMemberCarePackageStatusDialog from './MemberCarePackageStatusModal';
import PackageFilters from '@/components/care-package-management/PackageFilters';
import PackageSearchBar from '@/components/care-package-management/PackageSearchBar';
import MemberCarePackageStatistics from './MemberCarePackageStatistics';

// used for displaying status text
const STATUS_MAPPINGS = {
  Completed: 'bg-green-500/10 text-green-500',
  Invoice_Paid: 'bg-green-500/10 text-green-500',
  Invoice_Unpaid: 'bg-orange-500/10 text-orange-500',
  Invoice_Partially_Paid: 'bg-blue-500/10 text-blue-500',
};

// for package empty state
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
    <LuPackageX className="w-16 h-16 mb-4" />
    <p className="text-lg">{message}</p>
  </div>
);

const MemberCarePackageDashboard = () => {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackageForEdit, setSelectedPackageForEdit] = useState(null);
  const navigate = useNavigate();

  // pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const currentData = filteredPackages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // fetch member care packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/mcp/get-mcp');
        // console.log(response.data);
        setPackages(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // fetch member care package by id
  const fetchPackageById = async (id) => {
    setIsLoadingDetails(true);
    try {
      const response = await api.get(`/mcp/get-amcp/${id}`);
      if (!response.statusText) {
        throw new Error('Failed to fetch member care package details');
      }
      // console.log(response.data);
      setSelectedPackage(response.data);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // for status update
  const handleStatusUpdate = (packageId, newStatus) => {
    setPackages((prevPackages) =>
      prevPackages.map((pkg) =>
        pkg.member_care_package_id === packageId ? { ...pkg, member_care_package_status: Number(newStatus) } : pkg
      )
    );
  };

  // for search bar
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredPackages(packages);
      return;
    }

    const filtered = packages.filter(
      (pkg) =>
        pkg.care_package_name.toLowerCase().includes(searchTerm) ||
        pkg.cs_members.member_name.toLowerCase().includes(searchTerm)
    );
    setFilteredPackages(filtered);
  };

  const handleEditPackage = (packageId) => {
    navigate(`/mcp/${packageId}/edit`);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/mcp/get-mcp/');
        setPackages(response.data);
        setFilteredPackages(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const renderPackagesContent = () => {
    if (filteredPackages.length === 0) {
      return (
        <tr>
          <td colSpan="7">
            <EmptyState message="No member care packages found" />
          </td>
        </tr>
      );
    }

    return currentData.map((pkg) => (
      <tr key={pkg.member_care_package_id} className="border-b border-gray-300">
        <td className="p-4 text-gray-900">{pkg.cs_members.member_name}</td>
        <td className="p-4 text-gray-900">{pkg.care_package_name}</td>
        <td className="p-4 text-gray-900">${Number(pkg.member_care_package_total_amount).toFixed(2)}</td>
        <td className="p-4">
          <span
            className={`px-2 py-1 rounded-full ${
              STATUS_MAPPINGS[pkg.cs_status?.status_name] || 'bg-gray-200 text-gray-700'
            }`}
          >
            {pkg.cs_status?.status_name.replace(/Invoice|_/g, ' ')}
          </span>
        </td>
        <td className="p-4 flex gap-2">
          <Button
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            onClick={() => fetchPackageById(pkg.member_care_package_id)}
            disabled={isLoadingDetails}
          >
            <Eye size={16} data-testid="eye-icon" />
          </Button>
          <Button
            className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
            onClick={() => {
              setSelectedPackageForEdit(pkg);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit2 size={16} data-testid="edit-icon" />
          </Button>
          {pkg.cs_status?.status_name !== 'Invoice_Unpaid' && (
            <Button
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              onClick={() => navigate(`/mcp/${pkg.member_care_package_id}/consumption`)}
            >
              <LuCalendar size={16} data-testid="calendar-icon" />
            </Button>
          )}
          <Button
            onClick={() => handleEditPackage(pkg.member_care_package_id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <FilePenLine size={16} data-testid="filepenline-icon" />
          </Button>
        </td>
      </tr>
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 px-32 py-8">
        <div className="text-white text-center">Loading member care packages...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-32 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Member Care Package Management</h1>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center p-3"
            onClick={() => navigate('/mcpf')}
          >
            <LuPackagePlus className="mr-2 h-4 w-4" />
            Create Member Package
          </Button>
        </div>

        {/* statistics */}
        <div data-testid="mcp-stats-cards">
          <MemberCarePackageStatistics />
        </div>

        {/* search bar */}
        <PackageSearchBar onSearch={handleSearch} placeholder="Search by package or member name..." />

        {/* filter tabs */}
        <PackageFilters data={packages} onFilterChange={setFilteredPackages} type="member_care_package" />

        {/* member care package table */}
        <Card className="bg-white border border-gray-300 shadow-sm">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left p-4 text-gray-700 font-bold text-xl">Member Name</th>
                    <th className="text-left p-4 text-gray-700 font-bold text-xl">Package Name</th>
                    <th className="text-left p-4 text-gray-700 font-bold text-xl">Total Amount</th>
                    <th className="text-left p-4 text-gray-700 font-bold text-xl">Status</th>
                    <th className="text-left p-4 text-gray-700 font-bold text-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>{renderPackagesContent()}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>

        <EditMemberCarePackageStatusDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          memberCarePackage={selectedPackageForEdit}
          onStatusUpdate={handleStatusUpdate}
        />

        <MemberCarePackageDetails
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedPackage={selectedPackage}
        />
      </div>
    </div>
  );
};

export default MemberCarePackageDashboard;
