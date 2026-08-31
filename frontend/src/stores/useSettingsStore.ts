import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { applyDirection } from '../i18n';

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'light',

      setLanguage: (lang: Language) => {
        i18n.changeLanguage(lang);
        applyDirection(lang);
        set({ language: lang });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },
    }),
    {
      name: 'saveit-settings',
    }
  )
);
