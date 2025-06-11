import * as React from 'react';
import { Command, Users, CalendarDays, ShieldUser, Box, Wand, LayoutDashboard } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import useAuth from '@/hooks/useAuth';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Users',
      url: '#',
      icon: ShieldUser,
      isActive: true,
      items: [
        {
          title: 'View Users',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Services',
      url: '#',
      icon: Wand,
      items: [
        {
          title: 'Add New Service',
          url: 'create-service',
        },
        {
          title: 'Manage Services',
          url: 'manage-service',
        },
      ],
    },
    {
      title: 'Products',
      url: '#',
      icon: Box,
      items: [
        {
          title: 'Create Product',
          url: '#',
        },
        {
          title: 'Manage Products',
          url: '#',
        },
      ],
    },
    {
      title: 'Employees',
      url: '',
      icon: Users,
      items: [
        {
          title: 'Add new employee',
          url: '#',
        },
        {
          title: 'Manage employees',
          url: '#',
        },
        {
          title: 'Add new position',
          url: '/positions/add',
        },
        {
          title: 'Manage positions',
          url: '/positions',
        },
      ],
    },
    {
      title: 'Appointments',
      url: '#',
      icon: CalendarDays,
      items: [
        {
          title: 'View Appointments',
          url: '#',
        },
        {
          title: 'Add New Appointment',
          url: '#',
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { user } = useAuth();

  return (
    <Sidebar className='top-(--header-height) h-[calc(100svh-var(--header-height))]!' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='#'>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Cleo Spa</span>
                  <span className='truncate text-xs'>Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
