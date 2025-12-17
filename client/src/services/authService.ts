import api from './api';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  school_id: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
  school_id: number;
  // Add other fields if necessary
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  // The backend uses OAuth2PasswordRequestForm which expects form data.
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post<LoginResponse>('/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export interface SchoolRegistrationPayload {
  school_name: string;
  manager_name: string;
  address: string;
  admin_username: string;
  admin_password: string;
}

export const registerSchool = async (data: SchoolRegistrationPayload) => {
  const response = await api.post('/auth/register-school', data);
  return response.data;
};
