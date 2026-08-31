import { apiClient } from './client';

export type SettingsLanguage = 'en' | 'ar';
export type SettingsTheme = 'light' | 'dark' | 'system';

export interface UserSettings {
  id: string;
  userId: string;
  downloadPath: string | null;
  defaultQuality: string;
  defaultFormat: string;
  language: SettingsLanguage;
  theme: SettingsTheme;
  notificationsEnabled: boolean;
  concurrentDownloads: number;
  createdAt: string;
  updatedAt: string;
}

export async function getSettings(): Promise<UserSettings> {
  const response = await apiClient.get<{ success: true; data: UserSettings }>('/settings');
  return response.data;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const response = await apiClient.put<{ success: true; data: UserSettings }>('/settings', patch);
  return response.data;
}
