/*
 * Home.jsx (Dashboard landing page)
 * -------------------------------------------------------------------
 */

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import TodayAppointmentsCard from '@/components/ab/AppointmentCard';

export default function Home() {
  // yyyy-mm-dd format for today; pass as prop for explicitness
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {/* Dashboard cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dynamic appointments card */}
                <TodayAppointmentsCard date={today} />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}