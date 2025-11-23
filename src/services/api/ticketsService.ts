import { supabase } from '../../lib/supabase';
import { Ticket } from '../../types/ticket';
import { ticketMapper } from '../../utils/mappers/ticketMapper';
import * as sqliteService from '../sqliteService';

/**
 * Fetches the user's tickets.
 */
export async function getTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase.rpc('get_user_tickets', {
    last_sync_time: null,
  });
  if (error) throw error;
  
  const serverTickets = data.map(ticketMapper);

  // Insert to SQLite database
  await sqliteService.saveTickets(serverTickets);
  return serverTickets;
}

// Define the shape of the purchase request
export type PurchaseRequest = {
  eventId: number;
  quantity: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalPrice: number;
};

/**
 * Calls the atomic RPC to purchase tickets.
 */
export async function purchaseTickets(
  request: PurchaseRequest,
): Promise<Ticket[]> {
  const { data, error } = await supabase.rpc('purchase_tickets', {
    p_event_id: request.eventId,
    p_quantity: request.quantity,
    p_event_title: request.eventTitle,
    p_event_date: request.eventDate,
    p_event_time: request.eventTime,
    p_event_location: request.eventLocation,
    p_total_price: request.totalPrice,
  });
  if (error) throw error; // The error message (e.g., 'EVENT_SOLD_OUT') is thrown
  return data.map(ticketMapper);
}