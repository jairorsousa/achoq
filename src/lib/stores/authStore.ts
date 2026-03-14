import { create } from "zustand";

export interface AppAuthUser {
  uid: string;
  email: string | null;
  permissionLevel: "user" | "admin";
  isAdmin: boolean;
}

interface AuthStore {
  user: AppAuthUser | null;
  isLoading: boolean;
  hasProfile: boolean | null;
  setUser: (user: AppAuthUser | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasProfile: (has: boolean | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  hasProfile: null,
  setUser: (user) => set({ user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setHasProfile: (has) => set({ hasProfile: has }),
}));
