import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://3.218.156.15:5000';

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('swa_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const requestUrl = String(error.config?.url || '');
            const isAuthFormRequest = /\/auth\/(login|signup|forgot-password|reset-password)$/i.test(requestUrl);
            const message = error.response.data?.message?.toLowerCase();
            const isPendingValidation = message && message.includes('pending validation');

            if (!isPendingValidation && !isAuthFormRequest) {
                // Handle unauthorized error (e.g., redirect to login)
                localStorage.removeItem('swa_token');
                localStorage.removeItem('swa_user');
                window.location.href = '/'; // Or use a navigation state check in App.tsx
            }
        }
        return Promise.reject(error);
    }
);

export default api;
