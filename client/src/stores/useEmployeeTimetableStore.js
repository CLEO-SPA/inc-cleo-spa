import {create} from 'zustand';
import api from '@/services/api';

const useEmployeeTimetableStore = create((set, get) => ({
    // Data intialization with empty arrays
    employees: [],
    positions: [],
    timetableData: [],

    // Filters 
    selectedEmployee: null,
    selectedPosition: null,
    currentMonth: new Date(), // Default to current month
    searchTerm: '',

    // Loading state
    loading: {
        employees: false,
        positions: false,
        timetable: false,
    },

    // Actions
    setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
    setSelectedPosition: (position) => set({ 
        selectedPosition: position,
        searchTerm: '', // Reset search term when position changes
        selectedEmployee: null // Reset employee selection when position changes
    }),
    setCurrentMonth: (month) => set({ currentMonth: month }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value }
    })),

    // API calls
    loadEmployees: async () => {
        set((state) => ({
            loading: { ...state.loading, employees: true }
        }));
        try{
            // const response = await api.get('/em/basic-details');
            const response = await fetch('http://localhost:3000/api/em/basic-details');
            console.log('Loading employees from API...', response);
            const data = await response.json();
            console.log('Employees loaded:', data);
            if(data.success) {
                /**
                 * If loading has an error, we reset the loading value
                 */
                set({ employees: data.data});
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
        } finally {
            set((state) => ({
                loading: { ...state.loading, employees: false }
            }));
        }
    },
    loadPositions: async () => {
        set((state) => ({
            loading: { ...state.loading, positions: true }
        }));
        try {
            // const response = await api.get('/em/positions');
            /**
             * check errors 
             */
            const response = await fetch('http://localhost:3000/api/em/positions');
            console.log('Loading positions from API...', response);
            const data = await response.json();
            console.log('Positions loaded:', data);
            if(data.success) {
                set({ positions: data.data });
            }
        } catch (error) {
            console.error('Failed to load positions:', error);
        } finally {
            set((state) => ({
                loading: { ...state.loading, positions: false }
            }));
        }
    },
    loadTimetableData: async (month) => {
        set((state) => ({
            loading: { ...state.loading, timetable: true }
        }));
        try {
            const monthStr = month.toISOString().slice(0, 7); // Format month as YYYY-MM
            console.log('Loading timetable data for month:', monthStr);
            const { selectedEmployee, selectedPosition } = get();

            let url = `/api/et/timetable?month=${monthStr}`;
            /**
             * Implement both employee and position are selected
             * If both are selected, we will use employeeId and positionId as query parameters
             */
            if (selectedEmployee) {
                url = `/api/et/timetable?employeeId=${selectedEmployee}?month=${monthStr}`;
            } else if (selectedPosition) {
                url = `/api/et/timetable?positionId=${selectedPosition}?month=${monthStr}`;
            }
            console.log('Fetching timetable data from URL:', url);

            const response = await api.get(url);
            const data = await response.json();
            console.log('Timetable data loaded:', data);
            if(data.success) {
                if(data.data && Array.isArray(data.data)) {
                    /**
                     * If data is an array, we set the timetableData state
                     */
                set({ timetableData: data.data });
                }
                else if(data.data && !Array.isArray(data.data)){
                    /**
                     * If data is an object, we set the timetableData state
                     * which means we have a single timetable entry
                     */
                    set({ timetableData: [data.data] });
                } else {
                    /**
                     * If data is empty, we set the timetableData state to an empty array
                     */
                    set({ timetableData: [] });
                }
            } else {
                console.error('Failed to load timetable data:', data.error);
            }
        } catch (error) {
            console.error('Failed to load timetable data:', error);
        } finally {
            set((state) => ({
                loading: { ...state.loading, timetable: false }
            }));
        }
    },

    // Computed values
    getFilteredEmployees: () => {
        const { employees, selectedPosition, searchTerm } = get();
        let filtered = employees;
        // Filter by position if selected
        if (selectedPosition) {
            /**
             * Check whether position_id or positionId is used in the employee object
             * It could js be id 
             */
            filtered = filtered.filter(emp => emp.position_id === selectedPosition);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(emp => 
                emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    },

    // Initialization
    initialize: async () => {
        const { loadEmployees, loadPositions, loadTimetableData, currentMonth } = get();
        await Promise.all([
            loadEmployees(),
            loadPositions(),
            loadTimetableData(currentMonth)
        ]);
    }
}));

export default useEmployeeTimetableStore;