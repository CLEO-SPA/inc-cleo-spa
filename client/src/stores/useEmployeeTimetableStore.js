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

    // Pagination state
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPrevPage: false
    },

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
        selectedEmployee: null, // Reset employee selection when position changes
        pagination: { ...get().pagination, currentPage: 1 } // Reset to first page
    }),
    setCurrentMonth: (month) => set({ 
        currentMonth: month,
        pagination: { ...get().pagination, currentPage: 1 } // Reset to first page when month changes
    }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value }
    })),

    // Pagination actions
    setCurrentPage: (page) => set((state) => ({
        pagination: { ...state.pagination, currentPage: page }
    })),

    goToNextPage: async () => {
        const { pagination, loadTimetableData, currentMonth } = get();
        if (pagination.hasNextPage) {
            set((state) => ({
                pagination: { ...state.pagination, currentPage: state.pagination.currentPage + 1 }
            }));
            await loadTimetableData(currentMonth);
        }
    },

    goToPrevPage: async () => {
        const { pagination, loadTimetableData, currentMonth } = get();
        if (pagination.hasPrevPage) {
            set((state) => ({
                pagination: { ...state.pagination, currentPage: state.pagination.currentPage - 1 }
            }));
            await loadTimetableData(currentMonth);
        }
    },

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
            const { selectedEmployee, selectedPosition, pagination } = get();

            // Build URL with pagination parameters
            let url = `/api/et/timetables?month=${monthStr}&page=${pagination.currentPage}&limit=${pagination.pageSize}`;
            
            /**
             * Implement both employee and position filters
             */
            if (selectedEmployee) {
                // url += `&employeeId=${selectedEmployee.employee_id}`;
                url = `/api/et/employee/${selectedEmployee.id}?month=${monthStr}`;
            } else if (selectedPosition) {
                // url += `&position_id=${selectedPosition.position_id}`;
                url = `/api/et/position/${selectedPosition.id}?month=${monthStr}`;
            }
            
            console.log('Fetching timetable data from URL:', url);

            // const response = await api.get(url);
            const response = await fetch(`http://localhost:3000${url}`);
            const data = await response.json();
            console.log('API Response when searching:', data);
            console.log('Pagination from API:', data.pagination);
            // console.log('Timetable data loaded:', data);
            
            if(data.success) {
                // Update timetable data
                if(data.data && Array.isArray(data.data)) {
                    set({ timetableData: data.data });
                } else if(data.data && !Array.isArray(data.data)){
                    set({ timetableData: [data.data] });
                } else {
                    set({ timetableData: [] });
                }

                // Update pagination info
                if (data.pagination) {
                    set((state) => ({
                        pagination: {
                            ...state.pagination,
                            totalPages: data.pagination.total_pages,
                            totalItems: data.pagination.total_employees,  // ✅ Fix
                            hasNextPage: data.pagination.current_page < data.pagination.total_pages,  // ✅ Calculate
                            hasPrevPage: data.pagination.current_page > 1  // ✅ Calculate
                        }
                    }));
                }
            } else {
                console.error('Failed to load timetable data:', data.error);
                set({ timetableData: [] });
            }
        } catch (error) {
            console.error('Failed to load timetable data:', error);
            set({ timetableData: [] });
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
        // console.log('filtered employees:', filtered);
        // Filter by position if selected
        if (selectedPosition) {
            /**
             * Check whether position_id or positionId is used in the employee object
             * It could js be id 
             */
            filtered = filtered.filter(emp => emp.position_id === selectedPosition.position_id);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(emp => 
                emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
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