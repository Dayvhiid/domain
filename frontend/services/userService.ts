import api from './api';

export interface NotificationSettings {
    followUpReminders: boolean;
    pendingActions: boolean;
    newConverts: boolean;
    weeklyReports: boolean;
}

export const userService = {
    getNotifications: async (): Promise<any[]> => {
        const response = await api.get('/user/notifications');
        return response.data;
    },

    updateNotificationSettings: async (settings: NotificationSettings): Promise<any> => {
        const response = await api.patch('/user/notifications/settings', settings);
        return response.data;
    },

    updateProfile: async (data: any): Promise<any> => {
        const response = await api.patch('/user/profile', data);
        return response.data;
    },

    // Admin Methods
    getAllUsers: async (): Promise<any[]> => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    validateUser: async (userId: string, isValidated: boolean): Promise<any> => {
        const response = await api.patch(`/admin/users/${userId}/validate`, { isValidated });
        return response.data;
    },

    getPendingSoulWinners: async (): Promise<any[]> => {
        const response = await api.get('/admin/pending-soul-winners');
        return response.data;
    },
};
