import { supabase } from "../lib/supabase";
import { Ticket } from "../types/ticket";
import { getCurrentSession } from "../utils/sessionHelper";

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
  // Fetches user tickets using the RPC function
  async getUserTickets(lastSyncTimestamp: string | null): Promise<Ticket[]> {
    const session = await getCurrentSession();
    if (!session?.user) return [];

    const { data, error } = await supabase.rpc('get_user_tickets', {
        last_sync_time: lastSyncTimestamp
    });

    if (error) {
      console.error("Error fetching user tickets:", error.message);
      throw error;
    }
    return data.map(mapRpcToTicket);
  },

  // Get the most recent ticket timestamp for sync purposes
  async getLatestTicketTimestamp(): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_latest_ticket_timestamp').single();

    if (error) {
        // Ignore RLS policy if no rows are returned, means the table is empty.
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error("Error fetching latest ticket timestamp:", error);
        throw error;
    }
    return data as string | null;
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
