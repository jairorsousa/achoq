import { create } from "zustand";

export interface AppAuthUser {
  uid: string;
  email: string | null;
  permissionLevel: "user" | "admin";
  isAdmin: boolean;
}

interface AuthStore {
  firebaseUser: AppAuthUser | null; // kept name for compatibility during migration
  isLoading: boolean;
  hasProfile: boolean | null;
  setFirebaseUser: (user: AppAuthUser | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasProfile: (has: boolean | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  firebaseUser: null,
  isLoading: true,
  hasProfile: null,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setHasProfile: (has) => set({ hasProfile: has }),
}));
