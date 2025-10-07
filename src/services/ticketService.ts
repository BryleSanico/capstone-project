import { supabase } from "@/src/lib/supabase";
import { Ticket } from "@/src/types/ticket";
import { SupabaseTicket } from "@/src/services/types/ticket";
import { useAuth } from "@/src/hooks/auth-store";

// Helper function to map ticket data
const mapSupabaseToTicket = (item: SupabaseTicket): Ticket => ({
  id: item.id,
  eventId: item.event_id,
  eventTitle: item.event_title,
  eventDate: item.event_date,
  eventTime: item.event_time,
  eventLocation: item.event_location,
  quantity: item.quantity,
  totalPrice: item.total_price,
  purchaseDate: item.purchase_date,
  qrCode: item.qr_code,
});

const ticketService = {
  /**
   * Fetches all tickets for the currently logged-in user.
   */
  async getUserTickets(): Promise<Ticket[]> {
    const { session } = useAuth.getState();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', session.user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error("Error fetching user tickets:", error.message);
      throw error;
    }
    return data.map(mapSupabaseToTicket);
  },

  /**
   * Creates a new ticket in the database.
   */
  async createTicket(ticketData: Omit<Ticket, 'id' | 'purchaseDate'>): Promise<Ticket> {
    const { session } = useAuth.getState();
    if (!session?.user) throw new Error("User must be logged in to purchase tickets.");

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        user_id: session.user.id,
        event_id: ticketData.eventId,
        event_title: ticketData.eventTitle,
        event_date: ticketData.eventDate,
        event_time: ticketData.eventTime,
        event_location: ticketData.eventLocation,
        quantity: ticketData.quantity,
        total_price: ticketData.totalPrice,
        qr_code: ticketData.qrCode,
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error.message);
      throw error;
    }

    return mapSupabaseToTicket(data);
  }
};

export default ticketService;
