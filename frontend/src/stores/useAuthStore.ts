import { create } from 'zustand';
import { authApi } from '../api/auth';
import type { AuthUser } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmation: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  initialize: async () => {
    try { const response = await authApi.me(); set({ user: response.data.user, status: 'authenticated' }); }
    catch { set({ user: null, status: 'unauthenticated' }); }
  },
  login: async (email, password) => { const response = await authApi.login(email, password); set({ user: response.data.user, status: 'authenticated' }); },
  register: async (email, password, confirmation, displayName) => { const response = await authApi.register(email, password, confirmation, displayName); set({ user: response.data.user, status: 'authenticated' }); },
  logout: async () => { await authApi.logout(); set({ user: null, status: 'unauthenticated' }); },
}));