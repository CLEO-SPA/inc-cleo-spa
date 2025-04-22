import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuPackagePlus, LuUsers, LuBox, LuDollarSign, LuPackageX } from 'react-icons/lu';
import { Edit2, Eye, Trash2, X, FilePenLine } from 'lucide-react';
import { api } from '@/interceptors/axios';
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import CarePackageDetails from './CarePackageDetails';
import CarePackageEditForm from './CarePackageEditForm';
import EditStatusDialog from './CarePackageStatusModal';
import PackageFilters from '@/components/care-package-management/PackageFilters';
import PackageSearchBar from '@/components/care-package-management/PackageSearchBar';
import CarePackageStatistics from './CarePackageStatistics';

// used for displaying status text
const STATUS_MAPPINGS = {
  Draft: 'bg-yellow-500/10 text-yellow-500',
  Active: 'bg-green-500/10 text-green-500',
  Suspended: 'bg-orange-500/10 text-orange-500',
  Discontinued: 'bg-red-500/10 text-red-500',
  Expired: 'bg-gray-500/10 text-gray-500',
  Inactive: 'bg-red-500/10 text-red-500',
  Archived: 'bg-gray-500/10 text-gray-500',
};

// for package empty state
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
    <LuPackageX className="w-16 h-16 mb-4" />
    <p className="text-lg">{message}</p>
  </div>
);

const CarePackageDashboard = () => {
  const [carePackages, setCarePackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackageForEdit, setSelectedPackageForEdit] = useState(null);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState(null);
  const [members, setMembers] = useState([]);

  const navigate = useNavigate();

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const currentData = filteredPackages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // fetching all care packages
  useEffect(() => {
    const fetchCarePackages = async () => {
      try {
        const response = await api.get('/cp/get-cp');
        if (response.statusText !== 'OK') {
          throw new Error('Failed to fetch care packages');
        }

        // console.log(response.data);

        setCarePackages(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarePackages();
  }, []);

  // fetch package details
  const fetchPackageDetails = async (id) => {
    setIsLoadingDetails(true);
    try {
      const response = await api.get(`/cp/get-cp/${id}`);
      if (!response.statusText) {
        throw new Error('Failed to fetch package details');
      }
      setSelectedPackage(response.data);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/m/all');
        if (!response.statusText) {
          throw new Error('Failed to fetch members');
        }

        setMembers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // handling update of packages
  const handlePackageUpdate = (updatedPackage) => {
    setCarePackages((prevPackages) =>
      prevPackages.map((pkg) => (pkg.care_package_id === updatedPackage.care_package_id ? updatedPackage : pkg))
    );
    setFilteredPackages((prevPackages) =>
      prevPackages.map((pkg) => (pkg.care_package_id === updatedPackage.care_package_id ? updatedPackage : pkg))
    );
  };

  // delete package
  const handleDelete = async (packageId) => {
    setPackageToDelete(packageId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/cp/delete-cp/${packageToDelete}`);
      // console.log(response);

      if (response.statusText !== 'OK') {
        throw new Error('Failed to delete care package');
      }

      // remove the deleted package from state
      setCarePackages(carePackages.filter((pkg) => pkg.care_package_id !== packageToDelete));
    } catch (err) {
      console.error('Error deleting package:', err);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  // edit package status
  const getStatusStyle = (status) => {
    return STATUS_MAPPINGS[status] || 'bg-gray-500/10 text-gray-500';
  };

  const handleStatusUpdate = (packageId, newStatus) => {
    // console.log(newStatus);

    setCarePackages((prevPackages) =>
      prevPackages.map((pkg) =>
        pkg.care_package_id === packageId ? { ...pkg, cs_status: { ...pkg.cs_status, status_name: newStatus } } : pkg
      )
    );
  };

  // for search bar
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredPackages(carePackages);
      return;
    }

    const filtered = carePackages.filter((pkg) => pkg.care_package_name.toLowerCase().includes(searchTerm));
    setFilteredPackages(filtered);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/cp/get-cp/');
        setCarePackages(response.data);
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
          <td colSpan="5">
            <EmptyState message="No care packages available for this status" />
          </td>
        </tr>
      );
    }

    return currentData.map((pkg) => (
      <tr key={pkg.care_package_id} className="border-b border-gray-200">
        <td className="p-4 text-gray-900">{pkg.care_package_name}</td>
        <td className="p-4">
          {pkg.cs_care_package_item_details.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-600">
              {item.cs_service?.service_name} ({item.care_package_item_details_quantity} sessions)
            </div>
          ))}
        </td>
        <td className="p-4 text-gray-900">${Number(pkg.care_package_price).toFixed(2)}</td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full ${getStatusStyle(pkg.cs_status?.status_name)}`}>
            {pkg.cs_status?.status_name}
          </span>
        </td>
        <td className="p-4">
          <Button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            onClick={() => fetchPackageDetails(pkg.care_package_id)}
            disabled={isLoadingDetails}
          >
            <Eye size={16} data-testid="eye-icon" />
          </Button>
          <Button
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            onClick={() => {
              setSelectedPackageForEdit(pkg);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit2 size={16} data-testid="edit-icon" />
          </Button>
          <Button
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={() => handleDelete(pkg.care_package_id)}
            disabled={isDeleting}
          >
            <Trash2 size={16} data-testid="trash-icon" />
          </Button>
          {pkg.care_package_customizable && (
            <Button
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => {
                setPackageToEdit(pkg);
                setIsEditFormOpen(true);
              }}
            >
              <FilePenLine size={16} data-testid="edit-details-icon" />
            </Button>
          )}
        </td>
      </tr>
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-indicator" className="text-gray-600 text-lg">
          Loading care packages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="error-message" className="text-red-600 p-4 bg-red-50 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-32 py-8">
        {/* header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Care Package Management</h1>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center p-3"
            onClick={() => navigate('/cpf')}
          >
            <LuPackagePlus className="mr-2 h-4 w-4" />
            Create New Package
          </Button>
        </div>

        {/* stats grid */}
        <div>
          <CarePackageStatistics />
        </div>

        {/* search bar */}
        <PackageSearchBar onSearch={handleSearch} placeholder="Search by package name..." />

        {/* tabs */}
        <PackageFilters data={carePackages} onFilterChange={setFilteredPackages} type="care_package" />

        {/* packages table */}
        <Card className="bg-white border border-gray-200">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 text-gray-900 font-bold text-xl">Package Name</th>
                    <th className="text-left p-4 text-gray-900 font-bold text-xl">Services</th>
                    <th className="text-left p-4 text-gray-900 font-bold text-xl">Total Price</th>
                    <th className="text-left p-4 text-gray-900 font-bold text-xl">Status</th>
                    <th className="text-left p-4 text-gray-900 font-bold text-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>{renderPackagesContent()}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* edit dialog */}
        <EditStatusDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedPackageForEdit(null);
          }}
          carePackage={selectedPackageForEdit}
          onStatusUpdate={handleStatusUpdate}
        />

        <DialogRoot role="alertdialog" open={isDeleteDialogOpen}>
          <DialogContent className="fixed top-20 left-[50%] translate-x-[-50%] bg-white rounded-lg shadow-xl w-full max-w-md z-[100]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900">Delete Care Package</DialogTitle>
                <DialogCloseTrigger className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogCloseTrigger>
              </DialogHeader>

              <DialogBody className="text-gray-600">
                <p>Are you sure you want to delete this care package? This action cannot be undone.</p>
              </DialogBody>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-100"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* pagination */}
        <div className="mt-4">
          <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>

        {/* care package edit modal */}
        <CarePackageEditForm
          isOpen={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setPackageToEdit(null);
          }}
          carePackage={packageToEdit}
          onUpdate={handlePackageUpdate}
        />

        {/* care package details modal */}
        <CarePackageDetails
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedPackage={selectedPackage}
        />
      </div>
    </div>
  );
};

export default CarePackageDashboard;
