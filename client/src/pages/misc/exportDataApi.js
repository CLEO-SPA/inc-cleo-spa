// services/exportService.js
import { api } from '@/interceptors/axios.js';

export const exportService = {
    async exportEmployees() {
        try {
            const response = await api.get('/ed/employee');
            return response.data;
        } catch (error) {
            console.error('Error exporting employee:', error);
            throw error;
        }
    },

    async exportServices() {
        try {
            const response = await api.get('/ed/service');
            return response.data;
        } catch (error) {
            console.error('Error exporting services:', error);
            throw error;
        }
    },

    async exportProducts() {
        try {
            const response = await api.get('/ed/product');
            console.log("I am in product");
            return response.data;
        } catch (error) {
            console.error('Error exporting product:', error);
            throw error;
        }
    }
};