import { create } from "zustand";
import { Ticket } from "../types/ticket";
import storageService from "../services/storageService";
import ticketService from "../services/ticketService";
import { getCurrentSession } from "../utils/sessionHelper";
import { useNetworkStatus } from "./network-store";
import { Alert } from "react-native";
import { storageKeys } from "../utils/storageKeys"; 
import { useEvents } from "./event-store"; 

type TicketsState = {
  tickets: Ticket[];
  isLoading: boolean;
  addTickets: (ticketsData: Omit<Ticket, 'id' | 'purchaseDate'>[]) => Promise<boolean>;
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

  addTickets: async (ticketsData) => {
    const session = await getCurrentSession();

    if (!session?.user || ticketsData.length === 0) {
      Alert.alert('Please log in to purchase tickets.');
      return false;
    }

    try {
      const savedTickets = await ticketService.createTickets(ticketsData);
      
      const updatedTickets = [...savedTickets, ...get().tickets];
      set({ tickets: updatedTickets });

      const userId = session?.user?.id;
      
      const cacheKey = storageKeys.getTicketsCacheKey(userId);
      await storageService.setItem(cacheKey, updatedTickets);
      
      // After a successful purchase, optimistically update the event's attendee count
      const eventId = ticketsData[0].eventId;
      const quantityPurchased = ticketsData.length;
      useEvents.getState().incrementAttendeeCount(eventId, quantityPurchased);
      
      return true;
    } catch (err: any) {
      console.error("Error purchasing tickets:", err);
      Alert.alert('Ticket Purchase Error', err.message || 'There was an error purchasing your tickets.');
      // Re-sync event data to get the true available slot count on failure
      useEvents.getState().syncEvents({ query: '', category: 'All' });
      return false;
    }
  },
}));

