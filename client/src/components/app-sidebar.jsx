import * as React from 'react';
import {
  Command,
  Users,
  CalendarDays,
  ShieldUser,
  Box,
  Wand,
  LayoutDashboard,
  SquareUserRound,
  Package,
  Tickets,
  ChartColumnStacked,
  CreditCard,
  DollarSign,
  Receipt,
} from 'lucide-react';
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
      url: '/users',
      icon: ShieldUser,
      items: [
        {
          title: 'View Users',
          url: '/users',
        },
      ],
    },
    {
      title: 'Revenue',
      url: '#',
      icon: DollarSign,
      items: [
        {
          title: 'Revenue Report',
          url: '/rr',
        },
        {
          title: 'Deferred Revenue',
          url: '/dr',
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
          url: '/create-service',
        },
        {
          title: 'Manage Services',
          url: '/manage-service',
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
          url: '/create-product',
        },
        {
          title: 'Manage Products',
          url: '/manage-product',
        },
      ],
    },
    {
      title: 'Vouchers',
      url: '#',
      icon: Tickets,
      items: [
        {
          title: 'Create Voucher Template',
          url: '/voucher-template/create',
        },
        {
          title: 'Manage Voucher Templates',
          url: '/voucher-template',
        },
        {
          title: 'Manage Member Voucher',
          url: '/mv',
        }
      ],
    },
    {
      title: 'Members',
      url: '/member',
      icon: SquareUserRound,
      items: [
        {
          title: 'Manage Member',
          url: '/member',
        },
        {
          title: 'Create Member',
          url: '/member/create',
        },
        {
          title: 'Manage Membership Type',
          url: '/membership-type',
        },
      ],
    },
    {
      title: 'Care Packages',
      url: '#',
      icon: Package,
      items: [
        {
          title: 'Create Care Package',
          url: '/cp/c',
        },
        {
          title: 'Manage Care Packages',
          url: '/cp',
        },
        {
          title: 'Manage Member Care Package',
          url: '/mcp',
        },
      ],
    },
    {
      title: 'Sale Transactions',
      url: '#',
      icon: CreditCard,
      items: [
        {
          title: 'Create Sale Transactions',
          url: '/sale-transaction',
        },
        {
          title: 'View Sale Transactions',
          url: '/sale-transaction/list',
        },
      ],
    },
    {
      title: 'Employees',
      url: '/employees',
      icon: Users,
      items: [
        {
          title: 'Add new employee',
          url: '/employees/create',
        },
        {
          title: 'Manage employees',
          url: '/employees',
        },
        {
          title: 'Add new position',
          url: '/positions/create',
        },
        {
          title: 'Manage positions',
          url: '/positions',
        },
      ],
    },
    {
      title: 'Appointments',
      url: '/appointments',
      icon: CalendarDays,
      items: [
        {
          title: 'View Appointments',
          url: '/appointments',
        },
        {
          title: 'Add New Appointment',
          url: '/appointments/create',
        },
      ],
    },

    {
      title: 'Payment Methods',
      url: '/payment-method',
      icon: CreditCard,
      items: [
        {
          title: 'Manage Payment Methods',
          url: '/payment-method',
        },
      ],
    },
    {
      title: 'Refunds',
      icon: Receipt,
      items: [
        {
          title: 'Refund Management',
          url: '/refunds',
        },
        {
          title: 'Credit Notes',
          url: '/credit-notes',
        },
      ],
    },
    // {
    //   title: 'Statistics',
    //   url: '#',
    //   icon: ChartColumnStacked,
    //   items: [
    //     {
    //       title: 'View Database Report',
    //       url: '/dbcr',
    //     },
    //     {
    //       title: 'View Monthly Revenue Report',
    //       url: '#',
    //     },
    //   ],
    // },
    {
      title: 'Timetables',
      url: '#',
      icon: CalendarDays,
      items: [
        {
          title: 'Create Timetable',
          url: '/et/create-employee-timetable',
        },
        {
          title: 'Manage Timetable',
          url: '/et',
        },
      ],
    },
    {
      title: 'Others',
      url: '#',
      icon: ChartColumnStacked,
      items: [
        {
          title: 'Data Export',
          url: '/data-export',
        },
        {
          title: 'Translations',
          url: '/translations',
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { user } = useAuth();

  const dataForUser = React.useMemo(() => {
    const navData = {
      navMain: data.navMain.map((item) => ({
        ...item,
        items: item.items ? item.items.map((subItem) => ({ ...subItem })) : undefined,
      })),
    };
    if (user && user.role === 'super_admin') {
      const userSection = navData.navMain.find((item) => item.title === 'Users');
      if (userSection) {
        userSection.items.push({
          title: 'Create User',
          url: '/users/c',
        });
      }

      const othersSection = navData.navMain.find((item) => item.title === 'Others');
      if (othersSection) {
        othersSection.items.push({
          title: 'Data Seeding',
          url: '/seed',
        });
      }
    }
    return navData;
  }, [user]);

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
        <NavMain items={dataForUser.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
