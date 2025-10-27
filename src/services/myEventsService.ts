import { supabase } from "../lib/supabase";
import { Event, EventFormData } from "../types/event";
import { getCurrentSession } from "../helpers/sessionHelper";
import storageService from "./storageService";
import { storageKeys } from "../utils/storageKeys";
import { useNetworkStatus } from "../stores/network-store";
import { eventMapper } from "../utils/mappers/eventMapper";
import { eventService } from "./eventService";

const CACHE_EXPIRATION_DURATION = 1 * 60 * 60 * 1000; // 1 hour

type CachedMyEvents = {
  events: Event[];
  lastUpdatedAt: number;
};


// Helper to combine date and time into ISO string 
function combineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    console.error("Invalid date or time format received:", date, time);
    return null; // Or throw an error
  }
  try {
    // Attempt to create a date object. Assumes local timezone implicitly.
    const isoString = `${date}T${time}:00`;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      throw new Error("Invalid date/time combination");
    }
    return d.toISOString();
  } catch (e) {
    console.error("Error creating ISO string:", e);
    return null;
  }
}

// Helper to parse tags 
function parseTags(tagsString: string): string[] {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
}

// Invalidate all relevant caches 
async function invalidateCaches(userId?: string) {
  if (userId) {
     await storageService.removeItem(storageKeys.getMyEventsCacheKey(userId));
  }
  await eventService.clearCachedEvents(); 
  await eventService.clearCachedEventDetails();
  // Also clear the total count as it might change if events are added/removed
  await storageService.removeItem(storageKeys.getEventsTotalCountKey());
}

/**
 * [PRIVATE] Fetches all events for the user from the server RPC.
 */
async function _fetchMyEvents(): Promise<Event[]> {
  const { data, error } = await supabase.rpc('get_user_organized_events');

  if (error) {
    console.error("Error fetching user-organized events:", error.message);
    throw error;
  }
  return data.map(eventMapper); 
}

/**
 * [PUBLIC] Gets user's organized events, applying cache-first logic.
 */
async function getMyEvents(): Promise<Event[]> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return [];

  const cacheKey = storageKeys.getMyEventsCacheKey(userId);
  const cachedData = await storageService.getItem<CachedMyEvents>(cacheKey);
  const isCacheExpired = !cachedData || (Date.now() - cachedData.lastUpdatedAt) > CACHE_EXPIRATION_DURATION;

  if (cachedData && !isCacheExpired) {
    console.log("[MyEvents] Loading from fresh cache.");
    return cachedData.events;
  }

  if (useNetworkStatus.getState().isConnected) {
    console.log("[MyEvents] Cache expired/missing. Fetching from server.");
    try {
      const serverEvents = await _fetchMyEvents();
      await storageService.setItem(cacheKey, { events: serverEvents, lastUpdatedAt: Date.now() });
      return serverEvents;
    } catch (error) {
      console.error("Failed to load organized events from server:", error);
      return cachedData?.events || []; // Fallback to stale cache
    }
  }

  if (cachedData) {
    console.log("[MyEvents] Offline. Loading from stale cache.");
    return cachedData.events;
  }
  
  return []; // Offline with no cache
}

/**
 * [PUBLIC] Deletes a user's event.
 */
async function deleteEvent(eventId: number): Promise<void> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");

  const { error } = await supabase.rpc('delete_user_event', { p_event_id: eventId });
  if (error) {
    console.error("Error deleting event:", error.message);
    throw new Error(error.message);
  }
  
  await invalidateCaches(userId); // Use the helper
}

//  ADD CREATE EVENT METHOD 
async function createEvent(formData: EventFormData): Promise<Event> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");

  const startTime = combineDateTime(formData.date, formData.time);
  if (!startTime) throw new Error("Invalid Date or Time format.");

  const { data, error } = await supabase.rpc('create_event', {
    p_title: formData.title,
    p_description: formData.description,
    p_image_url: formData.imageUrl || 'https://placehold.co/600x400/EEE/31343C?text=Event+Image', // Default placeholder
    p_start_time: startTime,
    p_location: formData.location,
    p_address: formData.address || '', // Handle potentially empty optional field
    p_price: parseFloat(formData.price) || 0,
    p_category: formData.category,
    p_capacity: parseInt(formData.capacity, 10) || 0, // Default capacity if empty
    p_tags: parseTags(formData.tags),
    p_user_max_ticket_purchase: parseInt(formData.userMaxTicketPurchase, 10) || 10 // Default limit
  });

  if (error) {
    console.error("Error creating event:", error.message);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
     throw new Error("Event creation returned no data.");
  }

  await invalidateCaches(userId); // Invalidate caches on success

  return eventMapper(data[0]);
}

//  UPDATE updateEvent METHOD 
async function updateEvent(eventId: number, formData: EventFormData): Promise<Event> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");

  const startTime = combineDateTime(formData.date, formData.time);
  if (!startTime) throw new Error("Invalid Date or Time format.");

  const { data, error } = await supabase.rpc('update_user_event', {
    p_event_id: eventId,
    p_title: formData.title,
    p_description: formData.description,
    p_image_url: formData.imageUrl || 'https://placehold.co/600x400/EEE/31343C?text=Event+Image',
    p_start_time: startTime,
    p_location: formData.location,
    p_address: formData.address || '',
    p_price: parseFloat(formData.price) || 0,
    p_category: formData.category,
    p_capacity: parseInt(formData.capacity, 10) || 0,
    p_tags: parseTags(formData.tags),
    p_user_max_ticket_purchase: parseInt(formData.userMaxTicketPurchase, 10) || 10
  });

  if (error) {
    console.error("Error updating event:", error.message);
    throw new Error(error.message);
  }
   if (!data || data.length === 0) {
     throw new Error("Event update returned no data.");
  }

  await invalidateCaches(userId); // Invalidate caches on success

  return eventMapper(data[0]);
}


// Export the public-facing service object
export const myEventsService = {
  getMyEvents,
  deleteEvent,
  updateEvent,
  createEvent, 
};