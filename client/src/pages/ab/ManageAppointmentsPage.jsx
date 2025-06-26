/*
 * AppointmentPage Component
 * --------------------------------------------------
 * Wrapper page for viewing and managing spa appointments.
 * Allows toggling between two main views:
 * - Schedule View (grid/table layout per employee/time slot)
 * - List View (paginated appointment listing)
 *
 * Uses global layout components:
 * - SiteHeader: app top nav
 * - AppSidebar: app left nav
 * - SidebarInset: main content container
 *
 * Author: <your-name>
 * Date:   <yyyy-mm-dd>
 */

// -------------------------
// Imports
// -------------------------
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // (Unused, could remove unless needed for future extension)
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentTable } from '@/components/ab/AppointmentTable';
import AppointmentList from '@/components/ab/AppointmentList';
import { Link } from 'react-router-dom';

// =============================================================================
// Component: AppointmentPage
// =============================================================================
export default function AppointmentPage() {
  // Track current view style: "schedule" or "list"
  const [viewStyle, setViewStyle] = useState("schedule");

  // Called when dropdown changes view
  const handleViewChange = (value) => {
    setViewStyle(value);
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        {/* Global header and sidebar layout */}
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />

          {/* Main content area */}
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>

              {/* Page heading with actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
                  <p className="text-muted-foreground">
                    Manage your spa appointments and scheduling
                  </p>
                </div>

                {/* Right-side controls: view switcher + new appointment button */}
                <div className="flex items-center gap-2">
                  {/* View style switcher dropdown */}
                  <Select value={viewStyle} onValueChange={handleViewChange}>
                    <SelectTrigger className="w-[140px]">
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

                  {/* Create new appointment */}
                  <Button asChild>
                    <Link to="/appointments/create">
                      <Plus className="mr-2 h-4 w-4" />
                      New Appointment
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Render different views depending on dropdown selection */}
              {viewStyle === "schedule" && <AppointmentTable />}
              {viewStyle === "list" && <AppointmentList />}

            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}