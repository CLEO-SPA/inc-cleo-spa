import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';


import ConfirmationPopUp from '@/components/confirmationPopUp';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BackButtonHeader from '@/components/ui/backButtonWithNameHeader';
import MemberVoucherServices from '@/components/member-voucher-transaction-logs/memberVoucherServices';
import MemberVoucherTransactionLogs from '@/components/member-voucher-transaction-logs/memberVoucherTransactionLogs';
import MemberVoucherConsumptionForm from '@/components/member-voucher-transaction-logs/memberVoucherConsumptionCreateForm';
import ErrorAlert from '@/components/ui/errorAlert';
import TransactionLogUpdateForm from '@/components/member-voucher-transaction-logs/memberVoucherConsumptionUpdateForm';

const CreateMemberVoucherConsumptionPage = () => {
    const { memberId } = useParams();

    const {
        initialize,
        formData,
        error,
        errorMessage,
        isCreating,
        isUpdating,
        isDeleting,
        isConfirming,
        memberName,
        loading,

        clearError,
        createMemberVoucherTransactionLog,
        updateMemberVoucherTransactionLog,
        deletingMemberVoucherTransactionLog,
        setIsConfirming,
        setIsDeleting
    } = useMemberVoucherTransactionStore();

    useEffect(() => {
        initialize(memberId);
    }, [initialize]);

    const confirmBody = (
        <div>
            {Object.entries(formData).filter(([key, value]) => {
                return !['createdBy', 'handledBy', 'lastUpdatedBy'].includes(key);
            }).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b py-1">
                    <span className="font-medium">{key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</span>
                    <span>
                        {key === 'assignedEmployee' && Array.isArray(value)
                            ? value.map(emp => emp.employeeName).join(', ')
                            : value instanceof Date
                                ? value.toLocaleString()
                                : value?.toString() ?? ''}
                    </span>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
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
                                <BackButtonHeader name={memberName?.name || 'Loading...'} />
                            </div>
                            <MemberVoucherServices />
                            {/* Error Alert */}
                            {!isUpdating && error && <ErrorAlert error={error}
                                errorMessage={errorMessage}
                                onClose={clearError}
                            />}
                            <div className='flex'>
                                <div className='flex-1'>
                                    <MemberVoucherTransactionLogs />
                                </div>
                                <div className='w-80 shrink-0'>
                                    <MemberVoucherConsumptionForm />
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
            {/* Update Transaction Log Form */}
            {isUpdating && <TransactionLogUpdateForm />}

            {/* Create Confirmation Pop Up */}
            {isCreating && <ConfirmationPopUp
                open={isConfirming}
                title="Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    createMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsConfirming(false);
                }}
            />}

            {/* Updating Confirmation Pop Up */}
            {isUpdating && <ConfirmationPopUp
                open={isConfirming}
                title="Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    updateMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsConfirming(false);
                }}
            />}
            {/* Deleting Confirmation Pop Up */}
            {isDeleting && <ConfirmationPopUp
                open={isConfirming}
                title="Are you sure you wish to delete this and the subsequent entries? Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    deletingMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsDeleting(false);
                    setIsConfirming(false);
                }}
            />}

        </div>
    );
};

export default CreateMemberVoucherConsumptionPage;