import { api } from '@/interceptors/axios';

export const serviceRevenueApi = {
    getRevenueReport: async (month, year) => {
        try {
            console.log(`Revenue Report for ${month}/${year}`);
            const response = await api.get(`/srr/adHocRevenue`, {
                params: { month, year }
            });
            console.log(`Revenue Report: ${response.data}`);
            return response.data;
        } catch (error) {
            console.error(`error in getting revenue report: ${error}`);
            throw new Error(`error getting revenue report: ${error.message}`);
        }
    },
    getDetailsByDate: async (date) => {
        try {
            // Format date as ISO string and extract just the date part
            const dateStr = date.toISOString().split('T')[0];

            const response = await api.get('/srr/details', {
                params: { date: dateStr }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting revenue details:', error);
            throw new Error(error.message);
        }
    }
}