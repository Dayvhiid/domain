import axios from 'axios';
import api from './api';

export interface User {
    id?: string;
    name: string;
    email: string;
    role: string;
    parishId?: string;
    areaId?: string;
    zonalId?: string;
}

export interface SignupData extends User {
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authService = {
    signup: async (data: SignupData): Promise<AuthResponse> => {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },

    login: async (data: LoginData): Promise<AuthResponse> => {
        try {
            const response = await api.post('/auth/login', data, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 415) {
                const formData = new URLSearchParams({
                    email: data.email,
                    password: data.password,
                });

                const fallbackResponse = await api.post('/auth/login', formData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                    },
                });

                return fallbackResponse.data;
            }

            throw error;
        }
    },

    getProfile: async (): Promise<any> => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<any> => {
        const response = await api.post('/auth/change-password', data);
        return response.data;
    },

    forgotPassword: async (email: string): Promise<any> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (data: { token: string; newPassword: string }): Promise<any> => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },
};
