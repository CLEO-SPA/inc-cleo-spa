import React from "react";
import { TranslationProvider } from "@/context/TranslationContext";
import TranslationForm from "./translation.jsx"; // Adjust the path if needed

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const TranslationPage = () => {
    return (
        <TranslationProvider>
            <div className='[--header-height:calc(theme(spacing.14))]'>
                <SidebarProvider className='flex flex-col min-h-screen'>
                    <SiteHeader />
                    <div className='flex flex-1'>
                        {/* Sidebar */}
                        <AppSidebar />

                        {/* Translation Form */}
                        <div className="flex-1 p-6 flex justify-center">
                            <div className="w-full items-center justify-center max-w-3xl">
                                <TranslationForm />
                            </div>
                        </div>

                    </div>
                </SidebarProvider>
            </div>
        </TranslationProvider>
    );
};

export default TranslationPage;
