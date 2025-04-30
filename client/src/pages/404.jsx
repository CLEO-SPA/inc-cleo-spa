import React from 'react';
import { Container, Paper, Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';

const NotFoundPage = () => {
  const goBack = () => {
    window.history.back();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <Container component='main' maxWidth='sm' sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
        </Box>

        <Typography variant='h4' component='h1' gutterBottom>
          404 - Page Not Found
        </Typography>

        <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant='outlined' startIcon={<ArrowBackIcon />} onClick={goBack}>
            Go Back
          </Button>

          <Button variant='contained' startIcon={<HomeIcon />} onClick={goHome}>
            Go Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
