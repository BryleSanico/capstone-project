import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { Ticket } from "@/src/types/ticket";

const TICKETS_STORAGE_KEY = "user_tickets";
const FAVORITES_STORAGE_KEY = "favorite_events";

type TicketsState = {
  tickets: Ticket[];
  favorites: string[];
  isLoading: boolean;
  addTicket: (ticket: Ticket) => Promise<void>;
  toggleFavorite: (eventId: string) => Promise<void>;
  loadTickets: () => Promise<void>;
  loadFavorites: () => Promise<void>;
};

export const useTickets = create<TicketsState>()((set, get) => ({
  tickets: [],
  favorites: [],
  isLoading: true,

  loadTickets: async () => {
    try {
      const stored = await AsyncStorage.getItem(TICKETS_STORAGE_KEY);
      const parsed: Ticket[] = stored ? JSON.parse(stored) : [];
      set({ tickets: parsed, isLoading: false });
    } catch (err) {
      console.error("Failed to load tickets:", err);
      set({ isLoading: false });
    }
  },

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      set({ favorites: parsed });
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  },

  addTicket: async (ticket: Ticket) => {
    const updated = [...get().tickets, ticket];
    set({ tickets: updated });
    await AsyncStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
  },

  toggleFavorite: async (eventId: string) => {
    const { favorites } = get();
    const updated = favorites.includes(eventId)
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];
     console.log('[Zustand Store] Favorites updated to:', updated);
    set({ favorites: updated });
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  },
}));
