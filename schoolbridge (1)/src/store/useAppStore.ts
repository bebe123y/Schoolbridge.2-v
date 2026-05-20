import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

interface AppState {
  user: User | null;
  role: 'school' | 'parent' | 'admin' | null;
  onboardingCompleted: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  termsAccepted: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setRole: (role: 'school' | 'parent' | 'admin' | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      onboardingCompleted: false,
      isLoading: true,
      isInitialized: false,
      termsAccepted: false,
      error: null,

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setTermsAccepted: (termsAccepted) => set({ termsAccepted }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'schoolbridge-auth-storage',
      partialize: (state) => ({ termsAccepted: state.termsAccepted }),
    }
  )
);
