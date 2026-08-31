export type SettingsLanguage = 'en' | 'ar';
export type SettingsTheme = 'light' | 'dark' | 'system';

export interface SettingsRecord {
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

export interface SettingsInput {
  defaultQuality?: string;
  defaultFormat?: string;
  language?: SettingsLanguage;
  theme?: SettingsTheme;
  concurrentDownloads?: number;
  notificationsEnabled?: boolean;
  downloadPath?: string | null;
}
