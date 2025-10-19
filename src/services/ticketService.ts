// filename: src/services/ticketService.ts
import { supabase } from "../lib/supabase";
import { Ticket } from "../types/ticket";
import { getCurrentSession } from "../helpers/sessionHelper";

// Helper function to map ticket data from RPC function
const mapRpcToTicket = (item: any): Ticket => ({
  id: item.id,
  eventId: item.event_id,
  eventTitle: item.event_title,
  eventDate: item.event_date,
  eventTime: item.event_time,
  eventLocation: item.event_location,
  totalPrice: item.total_price,
  purchaseDate: item.purchase_date,
  qrCode: item.qr_code,
});

const ticketService = {
  /**
   * Fetches all tickets for the currently logged-in user.
   * This is now only called when the cache is empty or expired.
   */
  async getUserTickets(): Promise<Ticket[]> {
    const session = await getCurrentSession();
    if (!session?.user) return [];

    const { data, error } = await supabase.rpc('get_user_tickets', {
        last_sync_time: null // Always get the full list
    });

    if (error) {
      console.error("Error fetching user tickets:", error.message);
      throw error;
    }
    return data.map(mapRpcToTicket);
  },

  // Calls the atomic 'purchase_tickets' RPC function to handle the entire purchase transaction.
  async createTickets(ticketPurchaseRequest: {
    eventId: number;
    quantity: number;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    totalPrice: number;
  }): Promise<Ticket[]> {
    const session = await getCurrentSession();
    if (!session?.user) throw new Error("User must be logged in to purchase tickets.");

    const { data, error } = await supabase.rpc('purchase_tickets', {
      p_event_id: ticketPurchaseRequest.eventId,
      p_user_id: session.user.id,
      p_quantity: ticketPurchaseRequest.quantity,
      p_event_title: ticketPurchaseRequest.eventTitle,
      p_event_date: ticketPurchaseRequest.eventDate,
      p_event_time: ticketPurchaseRequest.eventTime,
      p_event_location: ticketPurchaseRequest.eventLocation,
      p_total_price: ticketPurchaseRequest.totalPrice,
    });

    if (error) {
      console.error("Error creating tickets:", error.message);
      // We can now throw the specific message from the database
      throw new Error(error.message);
    }

    return (data || []).map(mapRpcToTicket);
  }
};

export default ticketService;

