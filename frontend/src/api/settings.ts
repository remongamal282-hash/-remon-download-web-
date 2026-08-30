/** Settings API — stub for Phase 7 */
import { apiClient } from './client';

export interface UserSettings {
  language: 'en' | 'ar';
  theme: 'dark' | 'light';
  defaultQuality: string;
  defaultFormat: string;
  notificationsEnabled: boolean;
}

export async function getSettings(): Promise<UserSettings> {
  return apiClient.get<UserSettings>('/settings');
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  return apiClient.patch<UserSettings>('/settings', patch);
}
