import api from './api';

export interface SchoolInfo {
    id: number;
    name: string;
    manager_name: string;
    address?: string;
    logo_url?: string;
}

export const getSchoolInfo = async (): Promise<SchoolInfo> => {
    const response = await api.get('/school/');
    return response.data;
};
