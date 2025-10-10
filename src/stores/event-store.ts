import { create } from 'zustand';
import { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { useNetworkStatus } from '../stores/network-store';

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
    // Check network status before making an API call
    if (!useNetworkStatus.getState().isConnected) {
      set({ error: "You are offline. Please check your network connection.", isLoading: false, events: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await eventService.fetchEvents(0, query, category);
      set({
        events: data,
        hasMore: data.length > 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: "Sorry, we couldn't load events. Please try again later.", isLoading: false });
    }
  },

  fetchMoreEvents: async ({ query, category }) => {
    const { events, isPaginating } = get();
    if (isPaginating || !get().hasMore) return;

    // Prevent pagination attempts while offline
    if (!useNetworkStatus.getState().isConnected) {
      return;
    }

    set({ isPaginating: true });
    try {
      const page = Math.floor(events.length / 5);
      const data = await eventService.fetchEvents(page + 1, query, category);
      set((state) => ({
        events: [...state.events, ...data],
        hasMore: data.length > 0,
        isPaginating: false,
      }));
    } catch (err: any) {
      // Stop paginating
      set({ isPaginating: false, hasMore: false });
      console.error("Pagination failed:", err.message);
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
