import api from './api';

export interface Teacher {
  id?: number;
  first_name: string;
  last_name: string;
  tc_no?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  branch?: string;
  school_id?: number;
  created_at?: string;
}

export const getTeachers = async () => {
  const response = await api.get<Teacher[]>('/teachers/');
  return response.data;
};

export const getTeacher = async (id: number) => {
  const response = await api.get<Teacher>(`/teachers/${id}`);
  return response.data;
};

export interface TeacherCreatePayload {
  firstName: string;
  lastName: string;
  tcNo?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  branch?: string;
}

export type TeacherUpdatePayload = Partial<TeacherCreatePayload>;

export const createTeacher = async (data: TeacherCreatePayload) => {
  const response = await api.post('/teachers/', data);
  return response.data;
};

export const updateTeacher = async (id: number, data: TeacherUpdatePayload) => {
  const response = await api.put(`/teachers/${id}`, data);
  return response.data;
};

export const deleteTeacher = async (id: number) => {
  const response = await api.delete(`/teachers/${id}`);
  return response.data;
};
