import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';
import TimetableFilters from '@/components/employee-timetable/TimetableFilters';
import TimetableCalendar from '@/components/employee-timetable/TimetableCalendar';
import TimetablePagination from '@/components/employee-timetable/TimetablePagination';
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

  return (
    <div className='[--header-height:calc(theme(spacing.14))] bg-muted/50'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-6 p-6'>
              
              {/* Page Header Card */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='text-2xl font-bold text-gray-900'>
                        Employee Timetable
                      </CardTitle>
                      <CardDescription>
                        View and manage employee schedules and rest days
                      </CardDescription>
                    </div>
                    
                    {/* Action Buttons */}
                    {canCreate && (
                      <Button 
                        size='default'
                        onClick={handleCreateNew}
                        className='flex items-center gap-2'
                      >
                        <Plus className='h-4 w-4' />
                        Create New Timetable
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Filters Card */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Filters & Navigation</CardTitle>
                  <CardDescription>
                    Filter by position, search employees, or navigate between months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimetableFilters />
                </CardContent>
              </Card>

              {/* Main Timetable Card */}
              <Card className='flex-1 flex flex-col'>
                <CardHeader>
                  <CardTitle className='text-lg'>Schedule Overview</CardTitle>
                  <CardDescription>
                    Employee rest days and schedule information
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1 flex flex-col min-h-0'>
                  {loading.timetable ? (
                    <div className='flex items-center justify-center flex-1'>
                      <div className='text-center'>
                        <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3'></div>
                        <div className='text-muted-foreground text-sm'>Loading timetable data...</div>
                      </div>
                    </div>
                  ) : (
                    <div className='flex-1 flex flex-col min-h-0'>
                      <div className='flex-1 min-h-0 mb-4'>
                        <TimetableCalendar />
                      </div>
                      <div className='border-t pt-4'>
                        <TimetablePagination />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
} 