import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  IconButton, 
  Divider,
  Box,
  Typography
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const SideMenu = () => {
  const [open, setOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState({
    dashboard: false,
    users: false,
    settings: false,
  });

  // Toggle drawer open/closed
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Toggle expandable menu sections
  const handleMenuToggle = (menu) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu],
    });
  };

  // Main menu items with their icons and sub-menus
  const menuItems = [
    {
      id: 'dashboard',
      text: 'Dashboard',
      icon: <DashboardIcon />,
      subMenus: [
        { text: 'Overview', icon: <AssignmentIcon /> },
        { text: 'Analytics', icon: <DescriptionIcon /> },
      ],
    },
    {
      id: 'users',
      text: 'Users',
      icon: <PeopleIcon />,
      subMenus: [
        { text: 'Profile', icon: <PersonIcon /> },
        { text: 'Teams', icon: <GroupIcon /> },
      ],
    },
    {
      id: 'settings',
      text: 'Settings',
      icon: <SettingsIcon />,
      subMenus: [
        { text: 'General', icon: <BuildIcon /> },
        { text: 'Notifications', icon: <NotificationsIcon /> },
        { text: 'Messages', icon: <MailIcon /> },
      ],
    },
  ];

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? 240 : 65,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 65,
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      <DrawerHeader>
        {open && (
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Menu
          </Typography>
        )}
        <IconButton onClick={handleDrawerToggle}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <Box key={item.id}>
            <ListItem 
              button 
              onClick={() => handleMenuToggle(item.id)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText primary={item.text} />
                  {openMenus[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </>
              )}
            </ListItem>
            
            <Collapse in={open && openMenus[item.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.subMenus.map((subMenu, index) => (
                  <ListItem 
                    button 
                    key={index}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      {subMenu.icon}
                    </ListItemIcon>
                    <ListItemText primary={subMenu.text} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Drawer>
  );
};

export default SideMenu;

// Usage example:
// import SideMenu from './SideMenu';
// 
// function App() {
//   return (
//     <Box sx={{ display: 'flex' }}>
//       <SideMenu />
//       <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
//         {/* Main content */}
//       </Box>
//     </Box>
//   );
// }