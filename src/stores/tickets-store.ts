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
  syncTickets: () => Promise<void>;
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

    // Generate user-specific keys for the cache and load from user-specific cache for instant UI
    const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);
    const cachedTickets = await storageService.getItem<Ticket[]>(ticketsCacheKey) || [];
    set({ tickets: cachedTickets });

    await get().syncTickets();
    set({isLoading: false });
  },

  syncTickets: async() => {
        const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId || !useNetworkStatus.getState().isConnected) {
        if (!userId) set({ tickets: [] });
        return;
    };

    try {
        const syncKey = storageKeys.getTicketsSyncKey(userId);
        const lastSync = await storageService.getItem<string>(syncKey);
        const newTickets = await ticketService.getUserTickets(lastSync);

        if (newTickets.length > 0) {
            const existingTickets = get().tickets;
            const ticketMap = new Map(existingTickets.map(t => [t.id, t]));
            newTickets.forEach(ticket => ticketMap.set(ticket.id, ticket));
            const mergedTickets = Array.from(ticketMap.values()).sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

            set({ tickets: mergedTickets });
            await storageService.setItem(storageKeys.getTicketsCacheKey(userId), mergedTickets);
        }

        const latestTimestamp = await ticketService.getLatestTicketTimestamp();
        if (latestTimestamp) {
            await storageService.setItem(syncKey, latestTimestamp);
        }
    } catch (error) {
        console.error("Failed to sync tickets:", error);
    }
  },
  
  addTickets: async (purchaseRequest) => {
    const session = await getCurrentSession();

    if (!session?.user) {
      return { success: false, message: 'Please log in to purchase tickets.' };
    }

   try {
      const savedTickets = await ticketService.createTickets(purchaseRequest);
      
      // Update State on Success 
      const updatedTickets = [...savedTickets, ...get().tickets];
      set({ tickets: updatedTickets });
      
      const userId = session.user.id;
      await storageService.setItem(storageKeys.getTicketsCacheKey(userId), updatedTickets);
      
      // Manually update the event cache to reflect the new available slot count
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
      // Re-sync event data to get the true available slot count on failure
      useEvents.getState().syncEvents({ query: '', category: 'All' });
      return { success: false, message: 'There was an error purchasing your tickets.' };
    }
  },
}));

