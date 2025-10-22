import { create } from "zustand";
import { Ticket } from "../types/ticket";
import storageService from "../services/storageService";
import ticketService from "../services/ticketService";
import { getCurrentSession } from "../helpers/sessionHelper";
import { useNetworkStatus } from "./network-store";
import { storageKeys } from "../utils/storageKeys"; 
import { useEvents } from "./event-store"; 

type CachedTickets = {
  tickets: Ticket[];
  lastUpdatedAt: number;
};

const CACHE_EXPIRATION_DURATION = 24 * 60 * 60 * 1000;

type TicketsState = {
  tickets: Ticket[];
  isLoading: boolean;
  isSyncing: boolean;
  addTickets: (purchaseRequest: {
    eventId: number;
    quantity: number;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    totalPrice: number;
  }) => Promise<{ success: boolean; message?: string }>;
  loadTickets: () => Promise<void>;
  clearUserTickets: () => void; // Add this action
};

export const useTickets = create<TicketsState>()((set, get) => ({
  tickets: [],
  isLoading: false,
  isSyncing: false,

  clearUserTickets: () => {
    set({ tickets: [], isLoading: false });
  },

  loadTickets: async () => {
    set({ isLoading: true });
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    if (!userId) {
      set({ tickets: [], isLoading: false }); // Ensure state is cleared for guests
      return;
    }
    
    const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);
    const cachedData = await storageService.getItem<CachedTickets>(ticketsCacheKey);
    const isCacheExpired = !cachedData || (Date.now() - cachedData.lastUpdatedAt) > CACHE_EXPIRATION_DURATION;

    if (cachedData && !isCacheExpired) {
      // If valid cache exists, load it and stop.
      set({ tickets: cachedData.tickets, isLoading: false });
    } else if (useNetworkStatus.getState().isConnected) {
      // If cache is expired or missing, and connected to the network, fetch from server.
      try {
        const serverTickets = await ticketService.getUserTickets();
        set({ tickets: serverTickets });
        await storageService.setItem(ticketsCacheKey, { tickets: serverTickets, lastUpdatedAt: Date.now() });
      } catch (error) {
        console.error("Failed to load tickets from server:", error);
      } finally {
        set({ isLoading: false });
      }
    } else if (cachedData) {
      // Offline, but we have stale cache data to show.
      set({ tickets: cachedData.tickets, isLoading: false });
    } else {
      // Offline with no cache at all.
      set({ isLoading: false, tickets: [] });
    }
  },
  
  addTickets: async (purchaseRequest) => {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, message: 'Please log in to purchase tickets.' };
    }

   try {
      const savedTickets = await ticketService.createTickets(purchaseRequest);
      const updatedTickets = [...savedTickets, ...get().tickets];
      set({ tickets: updatedTickets });
      
      await storageService.setItem(storageKeys.getTicketsCacheKey(userId), { tickets: updatedTickets, lastUpdatedAt: Date.now() });
      
      useEvents.getState().decrementEventSlots(purchaseRequest.eventId, purchaseRequest.quantity);
      
      return { success: true };
    } catch (err: any) {
      console.error("Error purchasing tickets:", err);
      if (err.message?.includes('EVENT_SOLD_OUT')) {
        return { success: false, message: 'Sorry, this event is now sold out.' };
      }
      if (err.message?.includes('USER_TICKET_LIMIT_REACHED')) {
        return { success: false, message: "You've reached the maximum number of tickets for this event." };
      }
      useEvents.getState().syncEvents({ query: '', category: 'All' });
      return { success: false, message: 'There was an error purchasing your tickets.' };
    }
  },
}));
