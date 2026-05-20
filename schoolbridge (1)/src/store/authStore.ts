import { create } from 'zustand';
import { User } from 'firebase/auth';

type Role = 'school' | 'parent' | null;

interface AuthState {
  user: User | null;
  loading: boolean;
  role: Role;
  isVerified: boolean;
  termsAccepted: boolean;
  onboardingComplete: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setVerified: (status: boolean) => void;
  setTermsAccepted: (status: boolean) => void;
  setOnboardingComplete: (status: boolean) => void;
  setUserData: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  isVerified: false,
  termsAccepted: false,
  onboardingComplete: false,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setVerified: (status) => set({ isVerified: status }),
  setTermsAccepted: (status) => set({ termsAccepted: status }),
  setOnboardingComplete: (status) => set({ onboardingComplete: status }),
  setUserData: (data) => set((state) => ({ ...state, ...data })),
  clearAuth: () => set({ user: null, role: null, isVerified: false, termsAccepted: false, onboardingComplete: false, loading: false }),
}));
