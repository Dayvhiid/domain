import api from './api';

export interface DashboardStats {
    totalConverts: number;
    activeConverts: number;
    completedConverts: number;
    retentionRate: string;
    pendingSoulWinnersCount?: number;
}

export const dashboardService = {
    getSummaryStats: async (filters: any = {}): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats', { params: filters });
        return response.data;
    },

    getGrowthTrends: async (filters: any = {}): Promise<any[]> => {
        const response = await api.get('/dashboard/trends', { params: filters });
        return response.data;
    },

    getPendingFollowUps: async (filters: any = {}): Promise<any[]> => {
        const response = await api.get('/dashboard/pending-followups', { params: filters });
        return response.data;
    },
};
