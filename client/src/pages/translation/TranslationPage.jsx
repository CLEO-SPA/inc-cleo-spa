import React from "react";
import { TranslationProvider } from "@/context/TranslationContext";
import TranslationForm from "./translation.jsx";

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const TranslationPage = () => {
    return (
        <div className='h-screen overflow-y-auto [--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col h-full'>
                <SiteHeader />
                <TranslationProvider>
                    <div className='flex flex-1 min-h-0'>
                        <AppSidebar />

                        <SidebarInset className="flex-1">
                            <div className="flex flex-col h-full">
                                <div className="flex-1 flex justify-center items-start p-6">
                                    <div className="w-full max-w-3xl">
                                        <TranslationForm />
                                    </div>
                                </div>
                            </div>
                        </SidebarInset>
                    </div>
                </TranslationProvider>
            </SidebarProvider>
        </div>
    );
};

export default TranslationPage;
