import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';

export default function Home() {
  const todayAppointments = 8;
  const today = new Date().toISOString().split('T')[0]; // Format: yyyy-mm-dd

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                    <CardDescription>{today}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">{todayAppointments}</span>
                      <div className="rounded-full bg-primary/10 p-2">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <Progress value={100} className="mt-4 h-2" />
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                    >
                      <Link to={`/appointments?date=${today}`}>
                        <span>View Schedule</span>
                        <Clock className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}