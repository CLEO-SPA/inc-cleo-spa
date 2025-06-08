import React, { useState, useEffect, useMemo } from 'react';
import useAuth from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BackButtonHeader from '@/components/ui/backButtonWithNameHeader';
import MemberVoucherServices from '@/components/memberVoucherServices';
import MemberVoucherTransactionLogs from '@/components/memberVoucherTransactionLogs';
import MemberVoucherConsumptionForm from '@/components/memberVoucherConsumptionCreateForm';

const CreateMemberVoucherConsumptionPage = () => {
    const navigate = useNavigate();

    const {
        initialize
    } = useMemberVoucherTransactionStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleViewAll = () => {
        navigate(`/mv`);
    };

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='container mx-3'>
                            <BackButtonHeader name="Sarah Ang" onBack={handleViewAll} />
                        </div>
                        <MemberVoucherServices />
                        <div className='my-2 flex'>
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
        </div>
    );
};

export default CreateMemberVoucherConsumptionPage;