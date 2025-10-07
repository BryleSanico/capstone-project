import { create } from 'zustand';
import { Event } from '@/src/types/event';
import { eventService } from '@/src/services/eventService';

type EventsState = {
  events: Event[];
  categories: string[];
  favoriteEvents: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isPaginating: boolean;
  error: string | null;
  hasMore: boolean;
  fetchEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchMoreEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchFavoriteEvents: (ids: number[]) => Promise<void>;
  fetchEventById: (id: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
};

export const useEvents = create<EventsState>()((set, get) => ({
  events: [],
  categories: ['All'],
  favoriteEvents: [],
  currentEvent: null,
  isLoading: false,
  isPaginating: false,
  error: null,
  hasMore: true,

  fetchEvents: async ({ query, category }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await eventService.fetchEvents(0, query, category);
      set({
        events: data,
        hasMore: data.length > 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMoreEvents: async ({ query, category }) => {
    const { events, isPaginating } = get();
    if (isPaginating || !get().hasMore) return;

    set({ isPaginating: true });
    try {
      const page = Math.floor(events.length / 5); // Assuming 5 events per page
      const data = await eventService.fetchEvents(page + 1, query, category);
      set((state) => ({
        events: [...state.events, ...data],
        hasMore: data.length > 0,
        isPaginating: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isPaginating: false });
    }
  },

  fetchFavoriteEvents: async (ids: number[]) => {
    if (ids.length === 0) {
      set({ favoriteEvents: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const data = await eventService.fetchFavoriteEvents(ids);
      set({ favoriteEvents: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchEventById: async (id: number) => {
    set({ isLoading: true, error: null, currentEvent: null });
    try {
      const data = await eventService.fetchEventById(id);
      set({ currentEvent: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await eventService.fetchCategories();
      set({ categories: data });
    } catch (err: any) {
      console.error("Failed to fetch categories:", err.message);
    }
  },
}));
