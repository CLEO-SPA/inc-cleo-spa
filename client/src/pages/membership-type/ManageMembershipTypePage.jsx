import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import useMembershipStore from '@/stores/useMembershipTypeStore';

// Import your components
import MembershipTypeList from '@/components/membershipTypeList';
import CreateMembershipForm from '@/components/membership/CreateMembershipForm';
import UpdateMembershipTypeForm from '@/components/membership/UpdateMembershipForm';

const MembershipTypePage = () => {
  const { 
    initialize, 
    error,
    loading,

    isCreating,
    isUpdating,

    setIsCreating
  } = useMembershipStore();

  // Initialize data when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div>
      <Navbar />
      
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

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Main Table */}
      <MembershipTypeList />

      {/* Modals - Only render when needed */}
      {isCreating && <CreateMembershipForm />}
      {isUpdating && <UpdateMembershipTypeForm />}
    </div>
  );
};

export default MembershipTypePage;