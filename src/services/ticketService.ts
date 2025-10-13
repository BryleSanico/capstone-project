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

    async createTickets(ticketsData: Omit<Ticket, 'id' | 'purchaseDate'>[]): Promise<Ticket[]> {
    const session = await getCurrentSession();
    if (!session?.user) throw new Error("User must be logged in to purchase tickets.");

    const ticketsToInsert = ticketsData.map(ticket => ({
        user_id: session.user.id,
        event_id: ticket.eventId,
        event_title: ticket.eventTitle,
        event_date: ticket.eventDate,
        event_time: ticket.eventTime,
        event_location: ticket.eventLocation,
        total_price: ticket.totalPrice,
        qr_code: ticket.qrCode,
        purchase_date: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketsToInsert)
      .select();

    if (error) {
      console.error("Error creating tickets:", error.message);
      // Handle specific error for overbooking if a server-side check fails
      if (error.code === 'P0001') { // Custom error code for sold out
          throw new Error("Event is sold out. Purchase failed.");
      }
      throw error;
    }

    return data.map(mapRpcToTicket);
  }
};

export default ticketService;
