import { create } from "zustand";
import { Ticket } from "../types/ticket";
import storageService from "../services/storageService";
import ticketService from "../services/ticketService";
import { getCurrentSession } from "../utils/sessionHelper";
import { useNetworkStatus } from "./network-store";
import { Alert } from "react-native";
import { storageKeys } from "../utils/storageKeys"; 

type TicketsState = {
  tickets: Ticket[];
  isLoading: boolean;
  addTicket: (ticketData: Omit<Ticket, 'id' | 'purchaseDate'>) => Promise<boolean>;
  loadTickets: () => Promise<void>;
};

export const useTickets = create<TicketsState>()((set, get) => ({
  tickets: [],
  isLoading: true,

  loadTickets: async () => {
    set({ isLoading: true });
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    // If there's no logged-in user, clear the tickets and stop.
    if (!userId) {
        set({ tickets: [], isLoading: false });
        return;
    }

    // Generate user-specific keys for the cache.
    const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);
    const lastSyncKey = storageKeys.getTicketsSyncKey(userId);
    
    // 1. Load from user-specific cache for instant UI
    const cachedTickets = await storageService.getItem<Ticket[]>(ticketsCacheKey) || [];
    set({ tickets: cachedTickets });

    // 2. Sync with server if online
    if (!useNetworkStatus.getState().isConnected) {
        set({ isLoading: false });
        return;
    }

    try {
        const lastSync = await storageService.getItem<string>(lastSyncKey);
        const newTickets = await ticketService.getUserTickets(lastSync);

        if (newTickets.length > 0) {
            const ticketMap = new Map(cachedTickets.map(t => [t.id, t]));
            newTickets.forEach(ticket => ticketMap.set(ticket.id, ticket));
            const mergedTickets = Array.from(ticketMap.values()).sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

            set({ tickets: mergedTickets });
            await storageService.setItem(ticketsCacheKey, mergedTickets);
        }

        const latestTimestamp = await ticketService.getLatestTicketTimestamp();
        if (latestTimestamp) {
            await storageService.setItem(lastSyncKey, latestTimestamp);
        }
    } catch (error) {
        console.error("Failed to sync tickets:", error);
    } finally {
        set({ isLoading: false });
    }
  },

  addTicket: async (ticketData) => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    if (!userId) {
      Alert.alert('Please log in to purchase tickets.');
      return false;
    }

    const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);

    try {
      const savedTicket = await ticketService.createTicket(ticketData);
      const updatedTickets = [savedTicket, ...get().tickets];
      set({ tickets: updatedTickets });
      await storageService.setItem(ticketsCacheKey, updatedTickets);
      return true;
    } catch (err: any) {
      console.error("Error purchasing ticket:", err);
      Alert.alert('Ticket Purchase Error', 'There was an error purchasing your tickets.');
      return false;
    }
  },
}));

