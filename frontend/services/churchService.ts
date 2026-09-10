import api from './api';

export interface Zone {
    _id: string;
    name: string;
}

export interface Area {
    _id: string;
    name: string;
    zonalId: string;
}

export interface Parish {
    _id: string;
    name: string;
    areaId: string;
}

export interface HierarchyParish {
    _id: string;
    name: string;
}

export interface HierarchyArea {
    _id: string;
    name: string;
    parishes: HierarchyParish[];
}

export interface HierarchyZone {
    _id: string;
    name: string;
    areas: HierarchyArea[];
}

export const churchService = {
    getZones: async (): Promise<Zone[]> => {
        // Fallback or old mock logic if still needed elsewhere
        return [
            { _id: 'zone_1', name: 'Zone 1' },
            { _id: 'zone_2', name: 'Zone 2' },
            { _id: 'zone_3', name: 'Zone 3' }
        ];
    },

    getAreas: async (zonalId?: string): Promise<Area[]> => {
        return [
            { _id: 'area_1', name: 'Area 1', zonalId: zonalId || 'zone_1' },
            { _id: 'area_2', name: 'Area 2', zonalId: zonalId || 'zone_1' },
            { _id: 'area_3', name: 'Area 3', zonalId: zonalId || 'zone_1' }
        ];
    },

    getParishes: async (areaId?: string): Promise<Parish[]> => {
        return [
            { _id: 'parish_love', name: 'Love parish', areaId: areaId || 'area_1' },
            { _id: 'parish_hope', name: 'Hope parish', areaId: areaId || 'area_1' },
            { _id: 'parish_gentle', name: 'Gentle spirit parish', areaId: areaId || 'area_1' }
        ];
    },

    getHierarchyTree: async (): Promise<HierarchyZone[]> => {
        const response = await api.get('/hierarchy/tree');
        return response.data?.data || response.data || [];
    },

    getGlobalAreas: async (): Promise<any[]> => {
        const response = await api.get('/hierarchy/areas');
        return response.data?.data || response.data || [];
    },

    getAreaStats: async (areaId: string): Promise<any> => {
        const response = await api.get(`/hierarchy/areas/${areaId}/stats`);
        return response.data?.data || response.data || {};
    },

    getAreaDetails: async (areaId: string): Promise<any> => {
        const response = await api.get(`/hierarchy/areas/${areaId}/details`);
        return response.data?.data || response.data || { soulWinners: [], converts: [] };
    }
};
