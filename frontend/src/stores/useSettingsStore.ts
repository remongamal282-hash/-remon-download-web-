import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { applyDirection } from '../i18n';

export type Language = 'en' | 'ar';
export type Theme = 'dark'; // Light theme may be added in a future phase

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
      theme: 'dark',

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
      name: 'remon-settings',
    }
  )
);
