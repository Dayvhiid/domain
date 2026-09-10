import api from './api';

export interface Convert {
    id?: string;
    _id?: string;
    name: string;
    phone: string;
    whatsapp?: string;
    houseAddress: string;
    dateBornAgain: string;
    ageGroup: string;
    gender: string;
    maritalStatus: string;
    career: string;
    stage?: string;
    status?: string;
    lastUpdate?: string;
    visits?: number[];
    followUpVisits?: Array<{
        visitNumber: number;
        title: string;
        visitDate?: string;
        isCompleted: boolean;
    }>;
    spiritualGrowth?: {
        believerClass?: string;
        waterBaptism?: string;
        workersTraining?: string;
    };
}

export interface MilestoneUpdate {
    believerClass?: 'NotStarted' | 'InProgress' | 'Completed';
    waterBaptism?: 'NotStarted' | 'InProgress' | 'Completed';
    workersTraining?: 'NotStarted' | 'InProgress' | 'Completed';
}

export const convertService = {
    listConverts: async (page: number = 1, search: string = '', filters: any = {}): Promise<any> => {
        const response = await api.get('/converts', {
            params: {
                page,
                search,
                keyword: search, // Keep for backward compatibility
                pageNumber: page, // Keep for backward compatibility
                ...filters
            },
        });
        return response.data;
    },

    createConvert: async (data: Convert): Promise<Convert> => {
        const response = await api.post('/converts', data);
        return response.data;
    },

    async getConvertDetails(id: string): Promise<any> {
        const response = await api.get(`/converts/${id}`);
        return response.data;
    },

    updateConvert: async (id: string, data: Partial<Convert>): Promise<Convert> => {
        const response = await api.put(`/converts/${id}`, data);
        return response.data;
    },

    async updateVisitStatus(id: string, visitNum: number): Promise<any> {
        const response = await api.patch(`/converts/${id}/visits/${visitNum}`);
        return response.data;
    },

    async updateMilestones(id: string, milestones: any): Promise<any> {
        const response = await api.patch(`/converts/${id}/milestones`, milestones);
        return response.data;
    },
};
