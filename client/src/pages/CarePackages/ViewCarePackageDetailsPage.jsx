import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { NotFoundState } from '@/components/NotFoundState';
import { useCpSpecificStore } from '@/stores/useCpSpecificStore';
import useAuth from '@/hooks/useAuth';

const ViewCarePackageDetailsPage = () => {
  const { id } = useParams();
  const { currentPackage, isLoading, error, fetchPackageById, clearCurrentPackage, clearError } = useCpSpecificStore();
  const { statuses } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      console.log(`Fetching care package with ID: ${id}`);
      fetchPackageById(id);
    }

    return () => {
      clearCurrentPackage();
      clearError();
    };
  }, [id, fetchPackageById, clearCurrentPackage, clearError]);

  const handleEdit = (id) => {
    navigate(`/cp/${id}/edit`);
  };

  const handleDelete = () => {
    console.log('Delete functionality to be implemented');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border border-gray-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const renderMainContent = () => {
    // show loading state
    if (isLoading) {
      return <LoadingState />;
    }

    // show error state
    if (error) {
      return <ErrorState error={error} />;
    }

    // show not found state
    if (!currentPackage || !currentPackage.package) {
      return <NotFoundState />;
    }

    const packageData = currentPackage.package;
    const packageDetails = currentPackage.details || [];

    const getStatusById = (id) => {
      if (!statuses || statuses.length === 0) return null;
      return statuses.find((status) => status.id == id);
    };

    const currentStatus = getStatusById(packageData.status_id);

    return (
      <div className='min-h-screen bg-gray-50'>
        {/* header */}
        <div className='bg-white border-b border-gray-200 px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Button
                variant='ghost'
                onClick={() => window.history.back()}
                className='flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1'
              >
                <ArrowLeft className='w-4 h-4 mr-1' />
                Back
              </Button>
              <h1 className='text-lg font-semibold text-gray-900'>Care Package Details</h1>
            </div>
            <div className='flex space-x-2'>
              <Button
                onClick={() => handleEdit(packageData.id)} // ← Pass the actual ID
                className='flex items-center bg-gray-900 hover:bg-black text-white text-sm px-3 py-2'
              >
                <Edit className='w-4 h-4 mr-1' />
                Edit
              </Button>
              <Button onClick={handleDelete} variant='outline' className='flex items-center text-sm px-3 py-2'>
                <Trash2 className='w-4 h-4 mr-1' />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* main content */}
        <div className='max-w-7xl mx-auto px-4 py-2'>
          <div className='space-y-3'>
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='flex items-center text-gray-900 text-base font-semibold'>
                  <Package className='w-4 h-4 text-gray-700 mr-2' />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE ID</label>
                    <div className='text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded text-sm'>
                      #{packageData.id}
                    </div>
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PACKAGE NAME</label>
                    <div className='text-gray-900 px-2 py-1 bg-white border border-gray-200 rounded text-sm'>
                      {packageData.care_package_name}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>STATUS</label>
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        currentStatus?.status_name
                      )}`}
                    >
                      {currentStatus?.status_name || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CUSTOMIZABLE</label>
                    <div className='text-gray-900 px-2 py-1 bg-white border border-gray-200 rounded text-sm'>
                      {packageData.care_package_customizable ? 'Yes' : 'No'}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-white border border-gray-200 rounded text-sm'>
                      ${packageData.care_package_price || 0}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CREATED BY</label>
                    <div className='text-gray-700 px-2 py-1 bg-gray-50 rounded text-xs'>
                      User ID: {packageData.created_by}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>UPDATED BY</label>
                    <div className='text-gray-700 px-2 py-1 bg-gray-50 rounded text-xs'>
                      User ID: {packageData.last_updated_by}
                    </div>
                  </div>
                </div>

                {packageData.care_package_remarks && (
                  <div className='mt-4'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>REMARKS</label>
                    <div className='text-gray-700 px-2 py-2 bg-gray-50 rounded border border-gray-200 text-sm'>
                      {packageData.care_package_remarks}
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CREATED AT</label>
                    <div className='text-gray-600 text-sm px-2 py-1 bg-gray-50 rounded border border-gray-200'>
                      {packageData.created_at ? new Date(packageData.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>UPDATED AT</label>
                    <div className='text-gray-600 text-sm px-2 py-1 bg-gray-50 rounded border border-gray-200'>
                      {packageData.updated_at ? new Date(packageData.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='text-gray-900 text-base font-semibold'>Package Item Details</CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                {packageDetails.length > 0 ? (
                  <div className='space-y-3'>
                    {packageDetails.map((detail, index) => (
                      <div key={detail.id} className='border border-gray-200 rounded p-3 bg-gray-50/30'>
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='text-sm font-semibold text-gray-900'>Item {index + 1}</h4>
                          <span className='text-xs text-gray-500 bg-white px-2 py-1 rounded border'>
                            ID: {detail.id}
                          </span>
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>SERVICE ID</label>
                            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
                              {detail.service_id}
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>PRICE</label>
                            <div className='text-gray-900 font-semibold px-2 py-1 bg-white rounded border text-sm'>
                              ${detail.care_package_item_details_price}
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>DISCOUNT</label>
                            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
                              {detail.care_package_item_details_discount}%
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>QUANTITY</label>
                            <div className='text-gray-900 px-2 py-1 bg-white rounded border text-sm'>
                              {detail.care_package_item_details_quantity || 'N/A'}
                            </div>
                          </div>
                        </div>
                        {detail.care_package_item_details_remarks && (
                          <div className='mt-3'>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>ITEM REMARKS</label>
                            <div className='text-gray-700 px-2 py-1 bg-white rounded border text-sm'>
                              {detail.care_package_item_details_remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-6'>
                    <Package className='w-6 h-6 text-gray-400 mx-auto mb-2' />
                    <p className='text-gray-500 text-sm'>No item details available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>{renderMainContent()}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ViewCarePackageDetailsPage;
