import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  language: string;
}

interface AuthResponse { success: true; data: { user: AuthUser } }

export const authApi = {
  me: () => apiClient.get<AuthResponse>('/auth/me'),
  login: (email: string, password: string) => apiClient.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, passwordConfirmation: string, displayName?: string) => apiClient.post<AuthResponse>('/auth/register', { email, password, passwordConfirmation, displayName }),
  logout: () => apiClient.post<{ success: true; data: null }>('/auth/logout', {}),
};