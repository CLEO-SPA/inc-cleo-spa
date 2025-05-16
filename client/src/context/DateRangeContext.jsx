import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { parseISO, isValid } from 'date-fns';

const DateRangeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

export const DateRangeProvider = ({ children }) => {
  const [dateRange, setDateRangeState] = useState({
    from: undefined,
    to: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialDateRange = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/session/gdr');
        // console.log('Initial date range fetched from server:', response.data);

        if (response.data) {
          const rawStartDate = response.data.startDate_utc; // Should be a local Date object after interceptor
          const rawEndDate = response.data.endDate_utc; // Should be a local Date object after interceptor

          let finalFrom = undefined;
          let finalTo = undefined;

          if (rawStartDate instanceof Date && isValid(rawStartDate)) {
            finalFrom = rawStartDate;
          } else if (typeof rawStartDate === 'string') {
            finalFrom = parseISO(rawStartDate);
          }

          if (rawEndDate instanceof Date && isValid(rawEndDate)) {
            finalTo = rawEndDate;
          } else if (typeof rawEndDate === 'string') {
            finalTo = parseISO(rawEndDate);
          }

          if (isValid(finalFrom) && isValid(finalTo)) {
            setDateRangeState({ from: finalFrom, to: finalTo });
          } else if (isValid(finalFrom)) {
            setDateRangeState({ from: finalFrom, to: undefined });
          } else {
            setDateRangeState({ from: undefined, to: undefined });
          }
        } else {
          setDateRangeState({ from: undefined, to: undefined });
        }
      } catch (error) {
        console.error('Error fetching initial date range from session:', error);
        setDateRangeState({ from: undefined, to: undefined });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDateRange();
  }, []);

  const updateDateRangeOnServer = useCallback(async (startDate, endDate) => {
    try {
      const response = await api.post('/session/sdr', {
        startDate_utc: startDate === undefined ? null : startDate,
        endDate_utc: endDate === undefined ? null : endDate,
      });
      console.log('Date range sent to server.', response.data);
    } catch (error) {
      console.error('Error updating date range on server:', error.response ? error.response.data : error.message);
    }
  }, []);

  const setDateRange = useCallback(
    (newRange) => {
      let { from, to } = newRange;

      if (from) {
        if (!to) {
          to = new Date();
        }
        if (from > to) {
          console.warn('Attempting to set an invalid date range (start date is after end date).');
        }
        const validatedRange = { from, to };
        setDateRangeState(validatedRange);
        updateDateRangeOnServer(validatedRange.from, validatedRange.to);
      } else {
        const clearedRange = { from: undefined, to: undefined };
        setDateRangeState(clearedRange);
        updateDateRangeOnServer(undefined, undefined);
      }
    },
    [updateDateRangeOnServer]
  );

  const value = {
    dateRange,
    setDateRange,
    isLoading,
  };

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
};
