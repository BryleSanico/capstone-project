import { create } from "zustand";
import { Ticket } from "@/src/types/ticket";
import { useAuth } from "./auth-store";
import storageService from "../services/storageService";
import ticketService from "../services/ticketService";

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
    const { session } = useAuth.getState();

    if (session?.user) {
      try {
        const userTickets = await ticketService.getUserTickets();
        set({ tickets: userTickets, isLoading: false });
        await storageService.setItem(TICKETS_STORAGE_KEY, userTickets);
      } catch (err) {
        console.error("Failed to load tickets from DB.", err);
        set({ isLoading: false });
      }
    } else {
      const localTickets = await storageService.getItem<Ticket[]>(TICKETS_STORAGE_KEY);
      set({ tickets: localTickets || [], isLoading: false });
    }
  },

  addTicket: async (ticketData) => {
    const { session } = useAuth.getState();
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

