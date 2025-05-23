import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Users, TrendingUp, CalendarCheck, Star, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  // Sample data for the dashboard
  const todayAppointments = 8;
  const totalAppointments = 12;
  const revenue = 1250;
  const occupancyRate = 75;
  
  // Sample upcoming appointments
  const upcomingAppointments = [
    { id: 1, client: "Sarah Johnson", service: "Deep Tissue Massage", time: "10:30 AM", avatar: "/avatars/sarah.jpg" },
    { id: 2, client: "Michael Chen", service: "Facial Treatment", time: "11:45 AM", avatar: "/avatars/michael.jpg" },
    { id: 3, client: "Emma Davis", service: "Hot Stone Therapy", time: "2:15 PM", avatar: "/avatars/emma.jpg" },
  ];
  
  // Sample popular services
  const popularServices = [
    { name: "Swedish Massage", bookings: 48, growth: 12 },
    { name: "Aromatherapy", bookings: 32, growth: 8 },
    { name: "Hot Stone Massage", bookings: 28, growth: -3 },
    { name: "Deep Tissue Massage", bookings: 24, growth: 6 },
  ];

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Summary Cards - First Row */}
              <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                {/* Today's Appointments Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                    <CardDescription>May 19, 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold">{todayAppointments}</span>
                        <span className="text-sm text-muted-foreground">/ {totalAppointments}</span>
                      </div>
                      <div className="rounded-full bg-primary/10 p-2">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <Progress value={(todayAppointments / totalAppointments) * 100} className="mt-4 h-2" />
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>View Schedule</span>
                      <Clock className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Revenue Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    <CardDescription>Daily earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold">${revenue}</span>
                      </div>
                      <div className="rounded-full bg-green-500/10 p-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-500">+12% </span>
                      <span className="text-muted-foreground ml-1">from yesterday</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>Financial Summary</span>
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Occupancy Rate Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Spa Occupancy</CardTitle>
                    <CardDescription>Current capacity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold">{occupancyRate}%</span>
                      </div>
                      <div className="rounded-full bg-blue-500/10 p-2">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <Progress value={occupancyRate} className="mt-4 h-2" />
                  </CardContent>
                  <CardFooter className="pt-1">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>Room Allocation</span>
                      <Activity className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Main Content - Second Row */}
              <div className='grid gap-4 md:grid-cols-3'>
                {/* Upcoming Appointments Card */}
                <div className="md:col-span-2">
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <CardDescription>Today's scheduled clients</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Add New
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <div key={appointment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={appointment.avatar} alt={appointment.client} />
                                <AvatarFallback>{appointment.client.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{appointment.client}</div>
                                <div className="text-xs text-muted-foreground">{appointment.service}</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{appointment.time}</Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">View All Appointments</Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Popular Services Card */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Popular Services</CardTitle>
                    <CardDescription>This month's top treatments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {popularServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.bookings} bookings</p>
                          </div>
                          <div className={`flex items-center text-xs ${service.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {service.growth > 0 ? (
                              <TrendingUp className="mr-1 h-4 w-4" />
                            ) : (
                              <TrendingUp className="mr-1 h-4 w-4 rotate-180" />
                            )}
                            {service.growth > 0 ? '+' : ''}{service.growth}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Manage Services</Button>
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