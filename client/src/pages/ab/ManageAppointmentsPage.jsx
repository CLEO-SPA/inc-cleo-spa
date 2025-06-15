import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, LayoutGrid, List, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentTable } from '@/components/ab/appointment-table';
import { Link } from 'react-router-dom';
import AppointmentList from '@/components/ab/AppointmentList';
import App from '@/App';

export default function AppointmentPage() {
  const [viewStyle, setViewStyle] = useState("schedule");

  // Handle view style change
  const handleViewChange = (value) => {
    setViewStyle(value);
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Page Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
                  <p className="text-muted-foreground">
                    Manage your spa appointments and scheduling
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={viewStyle}
                    onValueChange={handleViewChange}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="View Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule" className="flex items-center">
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Schedule</span>
                      </SelectItem>
                      <SelectItem value="list" className="flex items-center">
                        <List className="mr-2 h-4 w-4" />
                        <span>List View</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button asChild>
                    <Link to="/appointments/create">
                      <Plus className="mr-2 h-4 w-4" />
                      New Appointment
                    </Link>
                  </Button>

                </div>
              </div>

              {/* Main Content based on View Style */}
              {viewStyle === "schedule" && (
                <AppointmentTable />
              )}

              {viewStyle === "list" && (
                <AppointmentList />
              )}

             
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}