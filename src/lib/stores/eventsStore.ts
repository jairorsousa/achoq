import { create } from "zustand";
import type { Event, EventCategory } from "@/lib/types";

type CategoryFilter = EventCategory | "all";

interface EventsStore {
  events: Event[];
  activeCategory: CategoryFilter;
  isLoading: boolean;
  setEvents: (events: Event[]) => void;
  setActiveCategory: (cat: CategoryFilter) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useEventsStore = create<EventsStore>((set) => ({
  events: [],
  activeCategory: "all",
  isLoading: true,
  setEvents: (events) => set({ events }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
