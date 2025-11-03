import { create } from "zustand";
import { Ticket } from "../types/ticket";
import ticketService from "../services/ticketService";
import { useEvents } from "./event-store"; 
import { handleAsyncAction } from "../utils/system/storeUtils";

type TicketsState = {
  tickets: Ticket[];
  isLoading: boolean;
  isSyncing: boolean; // NOTE: Not used yet, but good to have
  error: string | null; // Required for handleAsyncAction
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
  clearUserTickets: () => void;
};

export const useTickets = create<TicketsState>()((set, get) => ({
  tickets: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  clearUserTickets: () => {
    set({ tickets: [], isLoading: false, error: null });
  },

  loadTickets: async () => {
    await handleAsyncAction(set, get, "isLoading", async () => {
      const tickets = await ticketService.getTickets();
      return { tickets };
    });
  },
  
  addTickets: async (purchaseRequest) => {
    // This action has custom return logic, so we don't use handleAsyncAction
    // We keep the try/catch here to handle custom error messages.
   try {
      const savedTickets = await ticketService.purchaseTickets(purchaseRequest);

      //  Optimistically update the store's state
      set({ tickets: [...savedTickets, ...get().tickets] }); 
      
      // Call the cross-store side-effect
      useEvents.getState().decrementEventSlots(purchaseRequest.eventId, purchaseRequest.quantity);
      
      return { success: true };
    } catch (err: any) {
      console.error("Error purchasing tickets:", err);

      // Handle specific errors returned from the service/RPC
      if (err.message?.includes('EVENT_SOLD_OUT')) {
        return { success: false, message: 'Sorry, this event is now sold out.' };
      }
      if (err.message?.includes('USER_TICKET_LIMIT_REACHED')) {
        return { success: false, message: "You've reached the maximum number of tickets for this event." };
      }
      if (err.message?.includes('EVENT_NOT_FOUND')) {
        return { success: false, message: "Sorry, this event is deleted by the organizer." };
      }
      
      // Trigger a sync on the events store just in case
      // (e.g., if slots were off)
      useEvents.getState().syncEvents({ query: '', category: 'All' });
      return { success: false, message: 'There was an error purchasing your tickets.' };
    }
  },
}));