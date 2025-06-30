import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Download, Calendar } from 'lucide-react';

import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';
import TimetableFilters from '@/components/employee-timetable/TimetableFilters';
import MonthNavigator from '@/components/employee-timetable/MonthNavigator';
import TimetableCalendar from '@/components/employee-timetable/TimetableCalendar';
import TimetablePagination from '@/components/employee-timetable/TimetablePagination';
import CurrentDateDisplay from '@/components/employee-timetable/CurrentDateDisplay';
import useAuth from '@/hooks/useAuth';

export default function EmployeeTimetablePage() {
  const navigate = useNavigate();
  
  // --- Role-based access ---
  const { user } = useAuth();
  const canCreate = user?.role === 'super_admin' || user?.role === 'data_admin';
  const initialize = useEmployeeTimetableStore((state) => state.initialize);
  const loading = useEmployeeTimetableStore((state) => state.loading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateNew = () => {
    navigate('/et/create-employee-timetable');
  };

  const handleExport = () => {
    // Add export functionality here
    alert('Export functionality to be implemented');
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))] bg-muted/50'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-3 p-4 bg-gray-100'>
              <div className='p-4 bg-white rounded-lg border space-y-4 w-full max-w-full h-full flex flex-col'>
                
                {/* Page Header with Actions */}
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900'>Check Employee Timetable</h2>
                    <p className='text-xs text-muted-foreground'>View and manage employee schedules and rest days</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className='flex gap-2'>
                    {/* <Button 
                      variant='outline' 
                      size='sm'
                      onClick={handleExport}
                      className='flex items-center gap-1'
                    >
                      <Download className='h-3 w-3' />
                      Export
                    </Button> */}
                  {canCreate && (
                    <Button 
                      size='sm'
                      onClick={handleCreateNew}
                      className='flex items-center gap-1'
                    >
                      <Plus className='h-3 w-3' />
                      Create New
                    </Button>
                  )}
                  </div>
                </div>

                {/* Filters and Navigation */}
                <div className='flex flex-col gap-3 border-t pt-3'>
                  <TimetableFilters />
                </div>

                {/* Main Calendar View */}
                <div className='flex-1 border-t pt-3 min-h-0'>
                  <div className='bg-white rounded border shadow-sm h-full flex flex-col'>
                    {loading.timetable ? (
                      <div className='flex items-center justify-center flex-1'>
                        <div className='text-center'>
                          <div className='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mb-2'></div>
                          <div className='text-gray-500 text-sm'>Loading...</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='flex-1 min-h-0'>
                          <TimetableCalendar />
                        </div>
                        <div className='border-t flex-shrink-0'>
                          <TimetablePagination />
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}