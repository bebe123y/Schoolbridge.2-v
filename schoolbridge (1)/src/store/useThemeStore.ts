import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'light' | 'dark' | 'system' | 'glass';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'schoolbridge-theme',
    }
  )
);
