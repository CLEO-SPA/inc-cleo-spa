import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsumptionStore } from '@/stores/MemberCarePackage/useMcpConsumptionStore';
import useAuth from '@/hooks/useAuth';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BackButtonHeader from '@/components/ui/backButtonWithNameHeader';
import ErrorAlert from '@/components/ui/errorAlert';
import ConfirmationPopUp from '@/components/confirmationPopUp';
import { Loader2 } from 'lucide-react';

import MemberCarePackageServices from '@/components/member-care-package-consumption/MemberCarePackageServices';
import MemberCarePackageTransactionLogs from '@/components/member-care-package-consumption/MemberCarePackageTransactionLogs';
import MemberCarePackageConsumptionCreateForm from '@/components/member-care-package-consumption/MemberCarePackageConsumptionCreateForm';

const CreateMemberCarePackageConsumptionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const {
    fetchPackageData,
    updateMainField,
    currentPackageInfo,
    isLoading,
    error,
    detailForm,
    isConfirming,
    isSubmitting,
    setIsConfirming,
    submitConsumption,
  } = useConsumptionStore();

  useEffect(() => {
    if (id) {
      fetchPackageData(id);
    }
    // Reset store on unmount
    return () => {
      useConsumptionStore.getState().resetMainForm();
    };
  }, [id, fetchPackageData]);

  useEffect(() => {
    if (user && user.id) {
      updateMainField('employee_id', user.id);
    }
  }, [user, updateMainField]);

  const memberName = currentPackageInfo?.member?.name || 'Loading...';

  const confirmBody = (
    <div className='space-y-2'>
      <div className='flex justify-between border-b py-1'>
        <span className='font-medium text-muted-foreground'>Service</span>
        <span className='font-semibold'>{detailForm.service_name}</span>
      </div>
      <div className='flex justify-between border-b py-1'>
        <span className='font-medium text-muted-foreground'>Quantity</span>
        <span className='font-semibold'>{detailForm.mcpd_quantity}</span>
      </div>
      <div className='flex justify-between border-b py-1'>
        <span className='font-medium text-muted-foreground'>Date</span>
        <span className='font-semibold'>{new Date(detailForm.mcpd_date + 'T00:00:00').toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (isLoading && !currentPackageInfo) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2'>Loading package details...</span>
      </div>
    );
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div>
              <div className='container mx-3'>
                <BackButtonHeader name={memberName} onClick={() => navigate(-1)} />
              </div>
              <MemberCarePackageServices />
              {error && (
                <ErrorAlert errorMessage={error} onClose={() => useConsumptionStore.setState({ error: null })} />
              )}
              <div className='flex'>
                <div className='flex-1'>
                  <MemberCarePackageTransactionLogs />
                </div>
                <div className='w-80 shrink-0'>
                  <MemberCarePackageConsumptionCreateForm />
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      <ConfirmationPopUp
        open={isConfirming}
        title='Please Confirm Consumption'
        body={confirmBody}
        onConfirm={submitConsumption}
        onCancel={() => setIsConfirming(false)}
        isConfirming={isSubmitting}
      />
    </div>
  );
};

export default CreateMemberCarePackageConsumptionPage;
