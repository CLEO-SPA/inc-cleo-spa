import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  useTheme
} from '@mui/material';
import { 
  AttachMoney, 
  People, 
  Event as EventIcon, 
  Spa as SpaIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AccessTime as AccessTimeIcon,
  Face as FaceIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';


import SideMenu from '@/components/SideMenu.jsx';

// Chart component (placeholder)
const Chart = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.grey[100],
        borderRadius: 1
      }}
    >
      <Typography variant="body2" color="textSecondary">
        Appointment trends visualization would render here
      </Typography>
    </Box>
  );
};

// Stats card component
const StatsCard = ({ title, value, icon, color }) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const SpaManagementDashboard = () => {
  // Mock data for stats cards
  const statsData = [
    {
      title: 'Today\'s Revenue',
      value: '$1,850',
      icon: <AttachMoney />,
      color: '#2196f3'
    },
    {
      title: 'Today\'s Appointments',
      value: '24',
      icon: <EventIcon />,
      color: '#4caf50'
    },
    {
      title: 'Active Members',
      value: '342',
      icon: <People />,
      color: '#ff9800'
    },
    {
      title: 'Available Therapists',
      value: '8/12',
      icon: <SpaIcon />,
      color: '#9c27b0'
    }
  ];

  // Mock data for upcoming appointments
  const upcomingAppointments = [
    {
      client: 'Emma Thompson',
      service: 'Swedish Massage (60 min)',
      time: '10:30 AM',
      therapist: 'Michael Chen'
    },
    {
      client: 'Robert Johnson',
      service: 'Deep Tissue Massage (90 min)',
      time: '11:45 AM',
      therapist: 'Sarah Williams'
    },
    {
      client: 'Olivia Davis',
      service: 'Facial Treatment (45 min)',
      time: '1:15 PM',
      therapist: 'Jessica Park'
    },
    {
      client: 'James Wilson',
      service: 'Hot Stone Therapy (75 min)',
      time: '2:30 PM',
      therapist: 'David Reynolds'
    }
  ];

  // Mock data for popular services
  const popularServices = [
    {
      service: 'Swedish Massage',
      bookings: '42 this week',
      revenue: '$3,780',
      trend: '+12%'
    },
    {
      service: 'Deep Tissue Massage',
      bookings: '38 this week',
      revenue: '$4,560',
      trend: '+8%'
    },
    {
      service: 'Aromatherapy',
      bookings: '27 this week',
      revenue: '$2,430',
      trend: '+15%'
    },
    {
      service: 'Facial Treatment',
      bookings: '35 this week',
      revenue: '$3,150',
      trend: '+5%'
    }
  ];

  // Mock data for recent notifications
  const recentNotifications = [
    {
      message: 'New appointment request from Julie Brown',
      time: '5 minutes ago',
      type: 'request'
    },
    {
      message: 'Inventory alert: Massage oil running low',
      time: '1 hour ago',
      type: 'inventory'
    },
    {
      message: 'Lisa Johnson cancelled her 3:00 PM appointment',
      time: '2 hours ago',
      type: 'cancellation'
    },
    {
      message: 'Staff meeting scheduled for tomorrow at 9 AM',
      time: 'Yesterday',
      type: 'schedule'
    }
  ];

  // Get notification chip color based on type
  const getNotificationChip = (type) => {
    const types = {
      request: { color: 'primary', label: 'Request' },
      inventory: { color: 'warning', label: 'Inventory' },
      cancellation: { color: 'error', label: 'Cancellation' },
      schedule: { color: 'info', label: 'Schedule' }
    };
    return <Chip size="small" color={types[type].color} label={types[type].label} sx={{ ml: 1 }} />;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Import SideMenu from components folder */}
      <SideMenu />
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with search */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Spa Management Dashboard
          </Typography>
          <TextField
            size="small"
            placeholder="Search clients, services..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>

        {/* Stats cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatsCard 
                title={stat.title} 
                value={stat.value} 
                icon={stat.icon} 
                color={stat.color} 
              />
            </Grid>
          ))}
        </Grid>

        {/* Main content sections */}
        <Grid container spacing={3}>
          {/* Upcoming appointments */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Today's Appointments</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <List>
                {upcomingAppointments.map((appointment, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="span" variant="body1">
                              {appointment.client}
                            </Typography>
                            <Chip 
                              size="small" 
                              icon={<AccessTimeIcon />} 
                              label={appointment.time} 
                              sx={{ ml: 1 }} 
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {appointment.service}
                            </Typography>
                            {` • Therapist: ${appointment.therapist}`}
                          </>
                        }
                      />
                    </ListItem>
                    {index < upcomingAppointments.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Recent notifications */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Notifications
              </Typography>
              <List>
                {recentNotifications.map((notification, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="span" variant="body1">
                              {notification.message}
                            </Typography>
                            {getNotificationChip(notification.type)}
                          </Box>
                        }
                        secondary={notification.time}
                      />
                    </ListItem>
                    {index < recentNotifications.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Appointment trends chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Appointment Trends</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Chart />
            </Paper>
          </Grid>

          {/* Staff availability panel */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Staff Availability
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircleOutlineIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Sarah Williams" secondary="Available • Until 6:00 PM" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircleOutlineIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Michael Chen" secondary="Available • Until 7:00 PM" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Jessica Park" secondary="Busy • Available at 3:30 PM" />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="David Reynolds" secondary="On break • Back at 2:15 PM" />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Popular services */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                Popular Services
              </Typography>
              <Grid container spacing={2}>
                {popularServices.map((service, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card variant="outlined">
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#e1bee7' }}>
                            <SpaIcon />
                          </Avatar>
                        }
                        action={
                          <Chip 
                            size="small" 
                            color="success" 
                            label={service.trend} 
                            icon={<PersonIcon />} 
                          />
                        }
                        title={service.service}
                        subheader={`${service.bookings} • ${service.revenue}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SpaManagementDashboard;