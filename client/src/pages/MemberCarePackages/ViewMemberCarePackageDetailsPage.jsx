import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Package, AlertTriangle, User, CreditCard } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { NotFoundState } from '@/components/NotFoundState';
import { useMcpSpecificStore } from '@/stores/MemberCarePackage/useMcpSpecificStore';
import { useCpFormStore } from '@/stores/CarePackage/useCpFormStore';
import { useMcpFormStore } from '@/stores/MemberCarePackage/useMcpFormStore';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import useAuth from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ViewMemberCarePackageDetailsPage = () => {
  const { id } = useParams();
  const { currentPackage, isLoading, error, fetchPackageById, clearCurrentPackage, clearError, deletePackage } =
    useMcpSpecificStore();
  const { getEnabledServiceById } = useCpFormStore();
  const { updateMemberCarePackageStatus } = useMcpFormStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [serviceNames, setServiceNames] = useState({});
  const [serviceData, setServiceData] = useState({});
  const [loadingServiceNames, setLoadingServiceNames] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPackageById(id);
    }

    return () => {
      clearCurrentPackage();
      clearError();
    };
  }, [id, fetchPackageById, clearCurrentPackage, clearError]);

  useEffect(() => {
    const fetchServiceNames = async () => {
      if (!currentPackage?.details) return;

      setLoadingServiceNames(true);
      try {
        const serviceIds = [...new Set(currentPackage.details.map((d) => d.service_id))];
        const servicePromises = serviceIds.map(async (serviceId) => {
          try {
            const serviceData = await getEnabledServiceById(serviceId);
            return {
              id: serviceId,
              name: serviceData.service_name || `Service ${serviceId}`,
              data: serviceData,
            };
          } catch (error) {
            console.error(`Error fetching service ${serviceId}:`, error);
            return {
              id: serviceId,
              name: `Service ${serviceId}`,
              error: true,
            };
          }
        });

        const serviceResponses = await Promise.all(servicePromises);

        const serviceMap = {};
        const serviceDataMap = {};
        serviceResponses.forEach((response) => {
          serviceMap[response.id] = response.name;
          if (response.data) {
            serviceDataMap[response.id] = response.data;
          }
        });

        setServiceNames(serviceMap);
        setServiceData(serviceDataMap);
      } catch (error) {
        console.error('Error fetching service names:', error);
        const fallbackMap = {};
        currentPackage.details.forEach((detail) => {
          fallbackMap[detail.service_id] = `Service ${detail.service_id}`;
        });
        setServiceNames(fallbackMap);
      } finally {
        setLoadingServiceNames(false);
      }
    };

    fetchServiceNames();
  }, [currentPackage?.details, getEnabledServiceById]);

  const handleStatusToggle = async (serviceDetailId, currentStatus) => {
    if (!currentPackage?.package?.id) return;
    setUpdatingServiceId(serviceDetailId);
    try {
      const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
      await updateMemberCarePackageStatus(currentPackage.package.id, [{ id: serviceDetailId, status_name: newStatus }]);
      await fetchPackageById(id);
    } catch (err) {
      console.error('Failed to update service status:', err);
      alert(`Failed to update status: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentPackage?.package?.id) return;

    setIsDeleting(true);

    try {
      await deletePackage(currentPackage.package.id);
      navigate('/mcp');
    } catch (err) {
      console.error('Failed to delete member care package:', err);
      let errorMessage = 'Failed to delete member care package.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const isPackageEnabled = (pkg) => {
    if (!pkg) return false;
    const status = pkg.status || pkg.status_name;
    return status === 'ENABLED';
  };

  const canDeletePackage = (pkg) => {
    if (!pkg) return false;
    return !isPackageEnabled(pkg);
  };

  const getDeleteRestrictionReason = (pkg) => {
    if (!pkg) return 'Package not found.';

    if (isPackageEnabled(pkg)) {
      return 'This member care package is currently enabled and cannot be deleted. Please disable the package first by changing its status to "DISABLED" before attempting deletion.';
    }

    return null;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ENABLED':
        return 'bg-slate-100 text-slate-700';
      case 'DISABLED':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const transformPackageDetailsToServices = (packageDetails) => {
    return packageDetails.map((detail, index) => {
      const serviceInfo = serviceData[detail.service_id] || {};

      return {
        mcpd_id: detail.id,
        status: detail.status,
        id: detail.service_id,
        name: serviceNames[detail.service_id] || `Service ${detail.service_id}`,
        quantity: parseInt(detail.quantity) || 1,
        price: parseFloat(detail.price) || 0,
        originalPrice: parseFloat(serviceInfo.service_price) || parseFloat(detail.price) || 0,
        discount: parseFloat(detail.discount) || 1,
        service_description: serviceInfo.service_description || '',
        service_remarks: serviceInfo.service_remarks || detail.service_remarks || '',
        service_duration: serviceInfo.service_duration || 45,
        service_category_name: serviceInfo.service_category_name || '',
        updated_at: serviceInfo.updated_at || null,
        updated_by_name: serviceInfo.last_updated_by_name || null,
        created_at: serviceInfo.created_at || null,
        created_by_name: serviceInfo.created_by_name || null,
        remaining_quantity: detail.remaining_quantity || detail.quantity,
      };
    });
  };

  const calculateTotalValue = (transformedServices) => {
    return transformedServices.reduce((total, service) => {
      const unitPrice = service.price * service.discount;
      return total + unitPrice * service.quantity;
    }, 0);
  };

  const calculateRemainingBalance = (transformedServices) => {
    return transformedServices.reduce((total, service) => {
      const unitPrice = service.price * service.discount;
      return total + unitPrice * (service.remaining_quantity || 0);
    }, 0);
  };

  const canDelete = user?.role === 'super_admin';

  const renderMainContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} />;
    }

    if (!currentPackage || !currentPackage.package) {
      return <NotFoundState />;
    }

    const packageData = currentPackage.package;
    const packageDetails = currentPackage.details || [];
    const transformedServices = transformPackageDetailsToServices(packageDetails);

    const currentStatus = packageData.status || packageData.status_name || 'UNKNOWN';
    const isDeletable = canDeletePackage(packageData);

    const totalValue = calculateTotalValue(transformedServices);
    const remainingBalance = calculateRemainingBalance(transformedServices);

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
              <h1 className='text-lg font-semibold text-gray-900'>Member Care Package Details</h1>
            </div>
            <div className='flex space-x-2'>
              {canDelete && (
                <Button
                  onClick={handleDeleteClick}
                  variant='outline'
                  className={`flex items-center text-sm px-3 py-2 ${
                    !isDeletable
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-destructive hover:text-destructive hover:bg-destructive/10'
                  }`}
                  disabled={!isDeletable}
                  title={!isDeletable ? 'Package must be disabled before deletion' : 'Delete package'}
                >
                  <Trash2 className='w-4 h-4 mr-1' />
                  Delete
                  {!isDeletable && <AlertTriangle className='w-3 h-3 ml-1' />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* main content */}
        <div className='max-w-7xl mx-auto px-4 py-2'>
          <div className='space-y-3'>
            {/* package information card */}
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
                      {packageData.package_name}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>STATUS</label>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentStatus)}`}
                      >
                        {currentStatus}
                      </span>
                      {isPackageEnabled(packageData) && canDelete && (
                        <div className='group relative'>
                          <AlertTriangle className='h-4 w-4 text-amber-500' />
                          <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                            Disable to allow deletion
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>MEMBER ID</label>
                    <div className='text-gray-900 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm flex items-center'>
                      <User className='w-3 h-3 mr-1 text-blue-600' />
                      {packageData.member_id}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>EMPLOYEE ID</label>
                    <div className='text-gray-900 px-2 py-1 bg-white border border-gray-200 rounded text-sm'>
                      {packageData.employee_id || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>TOTAL PRICE</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-white border border-gray-200 rounded text-sm'>
                      ${parseFloat(packageData.total_price || 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CALCULATED TOTAL</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-green-50 border border-green-200 rounded text-sm'>
                      ${totalValue.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>CURRENT BALANCE</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-sm flex items-center'>
                      <CreditCard className='w-3 h-3 mr-1 text-yellow-600' />$
                      {parseFloat(packageData.balance || 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>REMAINING VALUE</label>
                    <div className='text-gray-900 font-semibold px-2 py-1 bg-purple-50 border border-purple-200 rounded text-sm'>
                      ${remainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>

                {packageData.package_remarks && (
                  <div className='mt-4'>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>REMARKS</label>
                    <div className='text-gray-700 px-2 py-2 bg-gray-50 rounded border border-gray-200 text-sm'>
                      {packageData.package_remarks}
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

            {/* package services card */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='border-b border-gray-100 px-4 py-1'>
                <CardTitle className='text-gray-900 text-base font-semibold'>
                  Package Services ({transformedServices.length} service{transformedServices.length !== 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className='p-3'>
                {transformedServices.length > 0 ? (
                  <div className='space-y-3'>
                    {loadingServiceNames && (
                      <div className='text-sm text-blue-600 mb-2'>Loading service details...</div>
                    )}

                    <style jsx>{`
                      .view-only-service-item .action-buttons,
                      .view-only-service-item button[title='Remove service'] {
                        display: none !important;
                      }
                    `}</style>
                    {transformedServices.map((service, index) => (
                      <div key={`${service.id}-${index}`} className='view-only-service-item'>
                        {/* Member care package specific service display */}
                        <div className='border border-gray-200 rounded-lg p-4 bg-white shadow-sm'>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center space-x-3'>
                              <h4 className='text-sm font-semibold text-gray-900'>{service.name}</h4>
                              <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                                ID: {service.id}
                              </span>
                              {service.service_category_name && (
                                <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                  {service.service_category_name}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Switch
                                id={`status-${service.mcpd_id}`}
                                checked={service.status === 'ENABLED'}
                                onCheckedChange={() => handleStatusToggle(service.mcpd_id, service.status)}
                                disabled={updatingServiceId === service.mcpd_id}
                              />
                              <Label htmlFor={`status-${service.mcpd_id}`} className='text-sm font-medium'>
                                {service.status === 'ENABLED' ? 'Enabled' : 'Disabled'}
                              </Label>
                            </div>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <div>
                              <label className='block text-xs font-medium text-gray-600 mb-1'>Original Quantity</label>
                              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                                {service.quantity}
                              </div>
                            </div>

                            <div>
                              <label className='block text-xs font-medium text-gray-600 mb-1'>Remaining Quantity</label>
                              <div
                                className={`w-full px-3 py-2 border rounded-md text-sm font-medium ${
                                  service.remaining_quantity > 0
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                              >
                                {service.remaining_quantity || 0}
                              </div>
                            </div>

                            <div>
                              <label className='block text-xs font-medium text-gray-600 mb-1'>Unit Price</label>
                              <div className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700'>
                                ${(service.price * service.discount).toFixed(2)}
                              </div>
                            </div>

                            <div>
                              <label className='block text-xs font-medium text-gray-600 mb-1'>Total Value</label>
                              <div className='w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-medium text-blue-700'>
                                ${(service.price * service.discount * service.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {service.discount < 1 && (
                            <div className='mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md'>
                              <div className='text-xs text-yellow-700'>
                                Discount Applied: {((1 - service.discount) * 100).toFixed(1)}% off (Original: $
                                {service.originalPrice.toFixed(2)})
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Package className='w-8 h-8 text-gray-400 mx-auto mb-3' />
                    <p className='text-gray-500 text-sm'>No services found in this package</p>
                    <p className='text-gray-400 text-xs mt-1'>
                      This package may have been created without services or there was an error loading the service
                      details.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* delete confirmation dialog */}
        {currentPackage?.package && (
          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            title='Delete Member Care Package'
            itemName={currentPackage.package.package_name}
            itemType='member care package'
            isDeleting={isDeleting}
            canDelete={canDeletePackage(currentPackage.package)}
            deleteRestrictionReason={getDeleteRestrictionReason(currentPackage.package)}
            destructiveAction={true}
            itemDetails={
              <div>
                <div>
                  <strong>Package ID:</strong> {currentPackage.package.id}
                </div>
                <div>
                  <strong>Member ID:</strong> {currentPackage.package.member_id}
                </div>
                <div>
                  <strong>Total Price:</strong> ${parseFloat(currentPackage.package.total_price || 0).toFixed(2)}
                </div>
                <div>
                  <strong>Current Balance:</strong> ${parseFloat(currentPackage.package.balance || 0).toFixed(2)}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  {currentPackage.package.status || currentPackage.package.status_name || 'Unknown'}
                </div>
                <div>
                  <strong>Services:</strong> {transformedServices.length} service
                  {transformedServices.length !== 1 ? 's' : ''}
                </div>
              </div>
            }
          />
        )}
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

export default ViewMemberCarePackageDetailsPage;
