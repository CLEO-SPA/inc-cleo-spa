import { create } from 'zustand';
import api from '@/services/api';
import { isValid } from 'date-fns';

export const useSimulationStore = create((set, get) => ({
  isSimulationActive: false,
  simulationStartDate: null,
  simulationEndDate: null,
  isLoadingSimulation: false,
  errorSimulation: null,
  initialLoadDone: false,

  fetchSimulationConfig: async () => {
    if (get().isLoadingSimulation || get().initialLoadDone) return;
    set({ isLoadingSimulation: true, errorSimulation: null });
    try {
      const response = await api.get('/session/sim');
      // Assuming interceptor converts startDate_utc and endDate_utc to Date objects
      const { is_simulation, startDate_utc, endDate_utc } = response.data;

      const startDate = startDate_utc instanceof Date && isValid(startDate_utc) ? startDate_utc : null;
      const endDate = endDate_utc instanceof Date && isValid(endDate_utc) ? endDate_utc : null;

      set({
        isSimulationActive: !!is_simulation,
        simulationStartDate: startDate,
        simulationEndDate: endDate,
        isLoadingSimulation: false,
        initialLoadDone: true,
      });
    } catch (error) {
      console.error('Failed to fetch simulation config:', error);
      set({
        isLoadingSimulation: false,
        errorSimulation: error.response?.data?.message || error.message || 'Failed to load simulation status.',
        initialLoadDone: true,
      });
    }
  },

  toggleSimulationStatus: async (isActive, startDate, endDate) => {
    set({ isLoadingSimulation: true, errorSimulation: null });
    try {
      const payload = {
        is_simulation: isActive,
        startDate_utc: isActive && startDate instanceof Date && isValid(startDate) ? startDate : null,
        endDate_utc: isActive && endDate instanceof Date && isValid(endDate) ? endDate : null,
      };
      await api.post('/session/sim', payload);

      set({
        isSimulationActive: isActive,
        simulationStartDate: isActive && startDate instanceof Date && isValid(startDate) ? startDate : null,
        simulationEndDate: isActive && endDate instanceof Date && isValid(endDate) ? endDate : null,
        isLoadingSimulation: false,
        errorSimulation: null, // Clear any previous error
      });
    } catch (error) {
      console.error('Failed to toggle simulation status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update simulation status.';

      // Attempt to re-fetch current state to ensure UI consistency after error
      await get().fetchSimulationConfig();

      // Update the store with the error, ensuring isLoadingSimulation is false.
      // fetchSimulationConfig might have already set isLoadingSimulation.
      set((state) => ({
        ...state,
        isLoadingSimulation: false,
        errorSimulation: errorMessage,
      }));

      alert(`Error: ${errorMessage}`); // Inform the user
      throw error; // Re-throw the error so the caller knows the operation failed
    }
  },
}));
