import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import PositionForm from '@/components/em/PositionForm'; // adjust path if needed

export default function EditPositionPage() {
  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <h1 className='text-2xl font-bold mb-4'>Edit Position</h1>
              <PositionForm mode="edit" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}