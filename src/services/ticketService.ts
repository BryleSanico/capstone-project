// filename: src/services/ticketService.ts
import { supabase } from "../lib/supabase";
import { Ticket } from "../types/ticket";
import { getCurrentSession } from "../helpers/sessionHelper";
import storageService from "./storageService";
import { storageKeys } from "../utils/storageKeys";
import { useNetworkStatus } from "../stores/network-store";
import { ticketMapper } from "../utils/mappers/ticketMapper";

const CACHE_EXPIRATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type CachedTickets = {
  tickets: Ticket[];
  lastUpdatedAt: number;
};

/**
 * [PRIVATE] Fetches all tickets for the user from the server.
 * Only called when the cache is empty or expired.
 */
async function _fetchUserTickets(): Promise<Ticket[]> {
  const session = await getCurrentSession();
  if (!session?.user) return [];

  const { data, error } = await supabase.rpc('get_user_tickets', {
      last_sync_time: null // Always get the full list
  });

  if (error) {
    console.error("Error fetching user tickets:", error.message);
    throw error;
  }
  return data.map(ticketMapper);
}

/**
 * [PRIVATE] Calls the atomic 'purchase_tickets' RPC function.
 */
async function _createTicketsRPC(ticketPurchaseRequest: {
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
    throw new Error(error.message); // Throw the specific DB message
  }

  return (data || []).map(ticketMapper);
}

/**
 * [PUBLIC] Loads tickets, applying cache-first logic.
 */
async function getTickets(): Promise<Ticket[]> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;

  if (!userId) {
    return []; // No user, return empty array
  }
  
  const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);
  const cachedData = await storageService.getItem<CachedTickets>(ticketsCacheKey);
  const isCacheExpired = !cachedData || (Date.now() - cachedData.lastUpdatedAt) > CACHE_EXPIRATION_DURATION;

  if (cachedData && !isCacheExpired) {
    console.log("[Tickets] Loading from fresh cache.");
    return cachedData.tickets;
  }

  if (useNetworkStatus.getState().isConnected) {
    console.log("[Tickets] Cache expired/missing. Fetching from server.");
    try {
      const serverTickets = await _fetchUserTickets();
      await storageService.setItem(ticketsCacheKey, { tickets: serverTickets, lastUpdatedAt: Date.now() });
      return serverTickets;
    } catch (error) {
      console.error("Failed to load tickets from server, falling back to stale cache if available.", error);
      return cachedData?.tickets || []; // Use stale cache if fetch fails
    }
  }

  if (cachedData) {
    console.log("[Tickets] Offline. Loading from stale cache.");
    return cachedData.tickets;
  }
  
  console.log("[Tickets] Offline with no cache.");
  return []; // Offline with no cache
}

/**
 * [PUBLIC] Purchases new tickets and updates the cache.
 *  handles the RPC call AND caching.
 */
async function purchaseTickets(purchaseRequest: {
  eventId: number;
  quantity: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalPrice: number;
}): Promise<Ticket[]> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User must be logged in.");
  }

  // Call the RPC function
  const savedTickets = await _createTicketsRPC(purchaseRequest);

  // Update the cache
  const ticketsCacheKey = storageKeys.getTicketsCacheKey(userId);
  const cachedData = await storageService.getItem<CachedTickets>(ticketsCacheKey);
  const currentTickets = cachedData?.tickets || [];
  
  // Prepend new tickets and save
  const updatedTickets = [...savedTickets, ...currentTickets];
  await storageService.setItem(ticketsCacheKey, { tickets: updatedTickets, lastUpdatedAt: Date.now() });

  // Return *only* the new tickets
  return savedTickets;
}

const ticketService = {
  getTickets,
  purchaseTickets,
};

export default ticketService;