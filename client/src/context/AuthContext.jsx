import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Auth
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // SSE Events
  const [sseEventSource, setSseEventSource] = useState(null);
  const [showReloadTimer, setShowReloadTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5);
  // Status
  const [statuses, setStatuses] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [statusesError, setStatusesError] = useState(null);
  const [statusesFetched, setStatusesFetched] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (statusesLoading) return;
    console.log('AuthContext: Fetching statuses...');
    setStatusesLoading(true);
    setStatusesError(null);
    try {
      const response = await api.get('/session/status');
      setStatuses(response.data || []);
      setStatusesFetched(true);
      // console.log('AuthContext: Statuses fetched and stored in context:', response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch statuses';
      console.error('AuthContext: Error fetching statuses:', errorMessage);
      setStatusesError(errorMessage);
      setStatusesFetched(true); // Still mark as fetched to avoid rapid re-fetches on error
    } finally {
      setStatusesLoading(false);
    }
  }, [statusesLoading]);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/status');
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('is authenticated');
        if (!statusesFetched) {
          fetchStatuses();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setStatuses([]);
        setStatusesFetched(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setStatuses([]);
      setStatusesFetched(false);
      if (error.response && error.response.status !== 401) {
        console.error('AuthContext: Failed to check auth status:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const handleAuthError = () => {
      console.log('AuthContext: Received Error 401. Logging out.');
      setUser(null);
      setIsAuthenticated(false);
      setStatuses([]);
      setStatusesFetched(false);
    };

    window.addEventListener('auth-error-401', handleAuthError);

    return () => {
      window.removeEventListener('auth-error-401', handleAuthError);
    };
  }, [checkAuthStatus]);

  useEffect(() => {
    let eventSource = null;

    const connectToSse = () => {
      if (sseEventSource) sseEventSource.close();
      if (eventSource) eventSource.close();

      console.log('AuthContext: Attempting to connect to SSE...');
      const sseUrl = import.meta.env.VITE_API_URL + '/api/session/events';
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        console.log('AuthContext: SSE connection established.');
      };

      eventSource.addEventListener('db_change', (event) => {
        console.log('AuthContext: Received db_change event:', event.data);
        try {
          const eventData = JSON.parse(event.data);
          // Check if the change is related to the 'statuses' table
          if (eventData && eventData.table === 'statuses') {
            console.log('AuthContext: Statuses table changed via SSE. Refreshing statuses cache.');
            fetchStatuses(); // Refresh statuses from the store
          } else if (eventData && eventData.table === 'system_parameters') {
            // For other db changes, use the reload timer
            console.log('AuthContext: A general DB change detected. Initiating reload timer.');
            setShowReloadTimer(true);
            setTimerSeconds(5); // Reset timer
          }
        } catch (e) {
          console.error('AuthContext: Error parsing db_change event data or processing it:', e);
          // Fallback to reload timer if parsing fails
          setShowReloadTimer(true);
          setTimerSeconds(5);
        }
      });

      eventSource.onerror = (error) => {
        console.error('AuthContext: SSE error:', error);
        if (eventSource) {
          eventSource.close();
        }
        // Optionally, you might want to implement a retry mechanism here.
      };
      setSseEventSource(eventSource);
    };

    const closeSseConnection = () => {
      if (sseEventSource) {
        console.log('AuthContext: Closing SSE connection.');
        sseEventSource.close();
        setSseEventSource(null);
      }

      if (eventSource) {
        eventSource.close();
      }
    };

    if (isAuthenticated) {
      if (!statusesFetched && !statusesLoading) {
        fetchStatuses();
      }
      connectToSse();
    } else {
      closeSseConnection();
      setShowReloadTimer(false); // Hide timer if user logs out or session expires
    }

    return () => {
      closeSseConnection();
    };
  }, [isAuthenticated]); // Re-run when isAuthenticated changes

  // Effect for the countdown timer
  useEffect(() => {
    let countdownInterval = null;
    if (showReloadTimer && timerSeconds > 0) {
      console.log(`Reloading in ${timerSeconds} seconds due to system update...`);
      // You could update a UI element here instead of just logging
      countdownInterval = setInterval(() => {
        setTimerSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (showReloadTimer && timerSeconds === 0) {
      console.log('Timer finished. Reloading page...');
      setShowReloadTimer(false); // Reset timer state
      window.location.reload(); // Reload the page
    }

    return () => {
      clearInterval(countdownInterval);
    };
  }, [showReloadTimer, timerSeconds]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // console.log('AuthContext: Login response:', response.data);

      if (response.data && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        await fetchStatuses();
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('AuthContext: Login failed:', error.response?.data?.message || error.message);
      setUser(null);
      setIsAuthenticated(false);
      setStatuses([]);
      setStatusesFetched(false);
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/auth/logout');
    } catch (error) {
      console.error('AuthContext: Logout API call failed:', error.response?.data?.message || error.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setStatuses([]);
      setStatusesFetched(false);
      setIsLoading(false);
    }
  };

  const getStatusNameById = useCallback(
    (id) => {
      const status = statuses.find((s) => String(s.id) === String(id));
      return status ? status.status_name : 'Unknown';
    },
    [statuses]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuthStatus,
        showReloadTimer,
        timerSeconds,
        setShowReloadTimer,
        setTimerSeconds,
        // Statuses
        statuses,
        statusesLoading,
        statusesError,
        statusesFetched,
        fetchStatuses,
        getStatusNameById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
