// src/services/api.js

// ✅ Use environment variable with fallback for local development
const API_BASE_URL = import.meta.env.VITE_API_URL ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000';

export const api = {
    // Generic request handler
    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);

            // Handle CORS/preflight errors
            if (response.status === 0) {
                throw new Error('Network error: Cannot reach backend server');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                console.error('❌ Connection refused - Is backend running on', API_BASE_URL);
                throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please start the Flask server.`);
            }
            throw error;
        }
    },

    // Helper methods
    get: (endpoint, options) => api.request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) =>
        api.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body, options) =>
        api.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint, options) =>
        api.request(endpoint, { ...options, method: 'DELETE' }),
};