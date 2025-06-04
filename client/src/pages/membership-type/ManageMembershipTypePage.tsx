import React, { useEffect } from 'react';
// import Navbar from '@/components/Navbar';
import useMembershipStore from '@/stores/useMembershipTypeStore';

import MembershipTypeList from '@/components/membershipTypeList';
import CreateMembershipForm from '@/components/membershipTypeCreateForm';
import ErrorAlert from '@/components/ui/errorAlert';

const MembershipTypePage = () => {
  const {
    initialize,
    error,
    errorMessage,
    loading,
    isCreating,

    clearError,
    setIsCreating
  } = useMembershipStore();

  // Initialize data when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div>
      {/* <Navbar /> */}

      {/* Header */}
      <div className="flex justify-between items-center m-6">
        <h1 className="text-2xl font-bold">Manage Membership Types</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          disabled={loading}
        >
          Add new membership type
        </button>
      </div>

      {/* Main Table */}
      <div className="mx-6">
        <MembershipTypeList />
      </div>
      {/* Modals - Only render when needed */}
      {isCreating && <CreateMembershipForm />}
    </div>
  );
};

export default MembershipTypePage;