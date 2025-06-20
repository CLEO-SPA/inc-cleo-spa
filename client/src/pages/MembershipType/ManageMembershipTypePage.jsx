import React, { useEffect } from 'react';
import useMembershipStore from '@/stores/useMembershipTypeStore';
import { Button } from '@/components/ui/button';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MembershipTypeList from '@/components/membership-type/membershipTypeList';
import CreateMembershipForm from '@/components/membership-type/membershipTypeCreateForm';
import ConfirmationPopUp from '@/components/confirmationPopUp';
import MembershipTypeUpdateForm from '@/components/membership-type/membershipTypeUpdateForm';
import ErrorAlert from '@/components/ui/errorAlert';

const MembershipTypePage = () => {
  const {
    initialize,
    error,
    errorMessage,
    loading,
    isCreating,
    isUpdating,
    isDeleting,
    formData,
    isConfirming,

    clearError,
    setIsCreating,
    setIsDeleting,
    setIsConfirming,
    createMembershipType,
    updateMembershipType,
    deleteMembershipType
  } = useMembershipStore();

  // Initialize data when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  // This is used to create the confirm pop-up body
  const confirmBody = (
    <div>
      {Object.entries(formData).map(([key, value]) => (
        <div key={key} className="flex justify-between border-b py-1">
          <span className="font-medium">{key}</span>
          <span>{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>

            {/* Header */}
            <div>
              <div className="flex justify-between items-center mt-6 mb-3 mx-6">
                <h1 className="text-2xl font-bold">Manage Membership Types</h1>
                <Button
                  onClick={() => setIsCreating(true)}
                  disabled={loading}
                >
                  Add new membership type
                </Button>
              </div>
              {/* Error Alert */}
              {!isCreating && !isUpdating && error && <ErrorAlert
                error={error}
                errorMessage={errorMessage}
                onClose={clearError}
              />}

              {/* Main Table */}
              <div className="mx-6 my-3">
                <MembershipTypeList />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {isCreating && <CreateMembershipForm />}
      {isUpdating && <MembershipTypeUpdateForm />}

      {/* Create Confirmation Pop Up */}
      {isCreating && <ConfirmationPopUp
        open={isConfirming}
        title="Please confirm your input"
        body={confirmBody}
        onCancel={() => {
          setIsConfirming(false);
        }}
        onConfirm={() => {
          createMembershipType();
        }}
      />}
      {/* Update Confirmation Pop Up */}

      {isUpdating && <ConfirmationPopUp
        open={isConfirming}
        title="Please confirm your input"
        body={confirmBody}
        onCancel={() => {
          setIsConfirming(false);
        }}
        onConfirm={() => {
          updateMembershipType();
        }}
      />}
      {/* Delete Confirmation Pop Up */}

      {isDeleting && <ConfirmationPopUp
        open={isConfirming}
        title="Are you sure you wish to delete this entry? Please confirm the following details"
        body={confirmBody}
        onCancel={() => {
          setIsDeleting(false);
          setIsConfirming(false);
        }}
        onConfirm={() => {
          deleteMembershipType();
        }}
      />}
    </div>
  );
};

export default MembershipTypePage;