import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Import the updated useAuth hook
import { Box, Spinner } from '@chakra-ui/react'; // For loading indicator

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
