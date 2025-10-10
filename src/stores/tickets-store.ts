import { create } from "zustand";
import { Ticket } from "../types/ticket";
import storageService from "../services/storageService";
import ticketService from "../services/ticketService";
import { getCurrentSession } from "../utils/sessionHelper";
import { useNetworkStatus } from "./network-store";

const TICKETS_STORAGE_KEY = "user_tickets";

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
    const { isConnected } = useNetworkStatus.getState();

    if (session?.user && isConnected) {
       // ONLINE & LOGGED IN: Fetch from DB, with local cache as fallback
      try {
        const userTickets = await ticketService.getUserTickets();
        set({ tickets: userTickets, isLoading: false });
        await storageService.setItem(TICKETS_STORAGE_KEY, userTickets);
      } catch (err) {
        console.error("Offline Fallback: Failed to load tickets from DB, using local cache.", err);
        const localTickets = await storageService.getItem<Ticket[]>(TICKETS_STORAGE_KEY) || [];
        set({ tickets: localTickets, isLoading: false });
      }
    } else {
      // OFFLINE or GUEST: Load directly from local storage
      const localTickets = await storageService.getItem<Ticket[]>(TICKETS_STORAGE_KEY) || [];
      // Ensure guests see no tickets, as storage is cleared on logout
      set({ tickets: session?.user ? localTickets : [], isLoading: false });
    }
  },

  addTicket: async (ticketData) => {
    const session = await getCurrentSession();
    if (!session?.user) {
      alert('Please log in or create an account to purchase tickets.');
      return false;
    }

    try {
      const savedTicket = await ticketService.createTicket(ticketData);
      const updatedTickets = [savedTicket, ...get().tickets];
      set({ tickets: updatedTickets });
      await storageService.setItem(TICKETS_STORAGE_KEY, updatedTickets);
      return true;
    } catch (err: any) {
      if (err.code === '23505') { // Unique constraint violation
        alert('You have already purchased tickets for this event.');
      } else {
        console.error("Error purchasing ticket:", err);
        alert('There was an error purchasing your tickets. Please try again.');
      }
      return false;
    }
  },
}));

