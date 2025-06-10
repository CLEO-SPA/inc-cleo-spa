import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import ConfirmationPopUp from '@/components/confirmationPopUp';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BackButtonHeader from '@/components/ui/backButtonWithNameHeader';
import MemberVoucherServices from '@/components/memberVoucherServices';
import MemberVoucherTransactionLogs from '@/components/memberVoucherTransactionLogs';
import MemberVoucherConsumptionForm from '@/components/memberVoucherConsumptionCreateForm';
import ErrorAlert from '@/components/ui/errorAlert';

const CreateMemberVoucherConsumptionPage = () => {
    const navigate = useNavigate();
    const { memberId } = useParams();

    // const handleDelete = async (data) => {
    //     console.log("Delete Data: " + data);

    //     if (!data) {
    //         throw new Error("The membership type has no id");
    //     }

    //     setFormValues(data);
    //     setShowConfirm(true);
    // };

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
        setIsCreating
    } = useMemberVoucherTransactionStore();

    useEffect(() => {
        initialize(memberId);
    }, [initialize]);

    const handleViewAll = () => {
        navigate(`/mv`);
    };

    const confirmBody = (
        <div>
            {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b py-1">
                    <span className="font-medium">{key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</span>
                    <span>
                        {value instanceof Date
                            ? value.toLocaleString()
                            : value?.toString() ?? ''}</span>
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
                        <div className='container mx-3'>
                            <BackButtonHeader name={memberName?.name || 'Loading...'} onBack={handleViewAll} />
                        </div>
                        <MemberVoucherServices />
                        {/* Error Alert */}
                        {error && <ErrorAlert error={error}
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
                    </SidebarInset>
                </div>
            </SidebarProvider>

            {/* Create Confirmation Pop Up */}
            {isCreating && <ConfirmationPopUp
                open={isConfirming}
                title="Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    createMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsCreating(false);
                    setIsConfirming(false);
                }
                }
            />}

            {/* Updating Confirmation Pop Up */}
            {isUpdating && <ConfirmationPopUp
                open={isConfirming}
                title="Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    createMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsCreating(false);
                    setIsConfirming(false);
                }
                }
            />}
            {/* Deleting Confirmation Pop Up */}
            {isDeleting && <ConfirmationPopUp
                open={isConfirming}
                title="Please confirm the following details"
                body={confirmBody}
                onConfirm={() => {
                    createMemberVoucherTransactionLog();
                }}
                onCancel={() => {
                    setIsCreating(false);
                    setIsConfirming(false);
                }
                }
            />}

        </div>
    );
};

export default CreateMemberVoucherConsumptionPage;