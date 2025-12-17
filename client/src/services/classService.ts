import api from './api';

export interface Class {
    id?: number;
    name: string;
    schedule_time?: string;
    room_number?: string;
    capacity?: number;
    grade_level?: string;
    branch?: string;
    teacher_id?: number;
    first_name?: string; // Teacher first name
    last_name?: string; // Teacher last name
    school_id?: number;
    created_at?: string;
}

export const getClasses = async () => {
    const response = await api.get<Class[]>('/classes/');
    return response.data;
};

export const getClass = async (id: number) => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
};

export interface ClassCreatePayload {
    name: string;
    capacity?: number;
    grade_level?: string;
    branch?: string;
    teacher_id?: number | null;
}

export type ClassUpdatePayload = ClassCreatePayload;

export const createClass = async (data: ClassCreatePayload) => {
    const response = await api.post('/classes/', data);
    return response.data;
};

export const updateClass = async (id: number, data: ClassUpdatePayload) => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
};

export const deleteClass = async (id: number) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
};
