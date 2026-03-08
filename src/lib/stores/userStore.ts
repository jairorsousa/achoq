import { create } from "zustand";
import type { User } from "@/lib/types";

interface UserStore {
  profile: User | null;
  setProfile: (profile: User | null) => void;
  updateCoins: (coins: number) => void;
  updateStreak: (streak: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateCoins: (coins) =>
    set((state) =>
      state.profile ? { profile: { ...state.profile, coins } } : {}
    ),
  updateStreak: (streak) =>
    set((state) =>
      state.profile ? { profile: { ...state.profile, streak } } : {}
    ),
}));
