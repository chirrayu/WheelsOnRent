// API utility functions
// TODO: Replace with actual backend API endpoints

// Using type assertion for Vite env - will be properly typed when backend is connected
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Authentication
export const authAPI = {
    login: async (_email: string, _password: string) => {
        // TODO: Implement actual API call
        // Example: const response = await fetch(`${API_BASE_URL}/auth/login`, { ... });
        throw new Error('Backend API not connected yet');
    },

    register: async (_name: string, _email: string, _password: string, _role: string) => {
        // TODO: Implement actual API call
        // Example: const response = await fetch(`${API_BASE_URL}/auth/register`, { ... });
        throw new Error('Backend API not connected yet');
    },

    logout: async () => {
        // TODO: Implement actual API call
        // Example: const response = await fetch(`${API_BASE_URL}/auth/logout`, { ... });
        console.log('API_BASE_URL:', API_BASE_URL); // Will be used when implementing
        return { success: true };
    },
};

// Locations
export const locationsAPI = {
    getAll: async () => {
        // TODO: Implement actual API call
        // Example: const response = await fetch(`${API_BASE_URL}/locations`);
        return { success: true, data: [] };
    },

    create: async (_location: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },

    update: async (_id: string, _location: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },
};

// Vehicles
export const vehiclesAPI = {
    getAll: async () => {
        // TODO: Implement actual API call
        return { success: true, data: [] };
    },

    create: async (_vehicle: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },

    update: async (_id: string, _vehicle: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },
};

// Pricing
export const pricingAPI = {
    getAll: async () => {
        // TODO: Implement actual API call
        return { success: true, data: [] };
    },

    update: async (_pricing: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },
};

// Bookings
export const bookingsAPI = {
    getAll: async () => {
        // TODO: Implement actual API call
        return { success: true, data: [] };
    },

    getUserBookings: async (_userId: string) => {
        // TODO: Implement actual API call
        return { success: true, data: [] };
    },

    create: async (_booking: any) => {
        // TODO: Implement actual API call
        throw new Error('Backend API not connected yet');
    },
};
