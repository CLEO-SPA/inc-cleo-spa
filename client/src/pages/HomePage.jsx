import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import useAuth from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  
  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Super Admin Test Button */}
              <div className='rounded-xl bg-muted/20 p-4 mb-4 border border-muted'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-semibold flex items-center gap-2'>
                    <ShieldAlert className="h-5 w-5" />
                    Super Admin Access Test
                  </h2>
                  
                  <Link to="/role-test">
                    <Button 
                      variant={isSuperAdmin ? "default" : "outline"} 
                      className={isSuperAdmin ? "" : "text-muted-foreground"}
                    >
                      Access Super Admin Page
                      {!isSuperAdmin && " (Access Denied)"}
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Original content */}
              <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
              </div>
              <div className='min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min' />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
