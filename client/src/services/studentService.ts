import api from './api';

export interface Student {
    id?: number;
    full_name: string;
    student_id: string; // School Number
    class_id?: number;
    photo_url?: string;
    face_encoding?: string;
    tc_no?: string;
    birth_date?: string;
    class_name?: string; // From join
    schedule_time?: string; // From join
    school_id?: number;
    created_at?: string;
}

export const getStudents = async () => {
    const response = await api.get<Student[]>('/students/');
    return response.data;
};

export const getStudent = async (id: number) => {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
};

export interface StudentCreatePayload {
    full_name: string;
    student_id: string;
    class_id?: number | null;
    photo_url?: string | null;
    face_encoding?: string | null;
    tc_no?: string;
    birth_date?: string;
    photos?: string[];
}

export type StudentUpdatePayload = Partial<StudentCreatePayload>;

export const createStudent = async (data: StudentCreatePayload) => {
    const response = await api.post('/students/', data);
    return response.data;
};

export const updateStudent = async (id: number, data: StudentUpdatePayload) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
};

export const deleteStudent = async (id: number) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
};
