import { supabase } from '../lib/supabase';
import { Event } from '../types/event';
import storageService from './storageService';
import { useNetworkStatus } from '../stores/network-store';
import { storageKeys } from '../utils/storageKeys';

// Helper to get the detailed event cache.
const getDetailCache = async (): Promise<Record<number, Event>> => {
  return await storageService.getItem<Record<number, Event>>(storageKeys.getEventsDetailCacheKey()) || {};
};

// Helper to save an event (or multiple events) to the detailed cache.
const cacheEventDetails = async (events: Event[]) => {
  if (events.length === 0) return;
  const cache = await getDetailCache();
  events.forEach(event => {
    cache[event.id] = event;
  });
  await storageService.setItem(storageKeys.getEventsDetailCacheKey(), cache);
};

// Centralized mapping function remains the same.
const mapSupabaseToEvent = (item: any): Event => {
  const organizerProfile = item.organizer || item.event_organizers?.[0]?.profiles || item.profiles;
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    startTime: item.start_time,
    location: item.location,
    address: item.address,
    price: item.price,
    category: item.category,
    organizer: organizerProfile ? {
      id: organizerProfile.id,
      fullName: organizerProfile.fullName || organizerProfile.full_name,
      email: organizerProfile.email || '',
      avatar: organizerProfile.avatar || organizerProfile.avatar_url,
    } : {
      id: '00000000-0000-0000-0000-000000000000',
      fullName: 'Community Event',
      email: '',
      avatar: undefined,
    },
    capacity: item.capacity,
    attendees: item.attendees_count || 0,
    tags: item.tags || [],
    updatedAt: item.updated_at,
    availableSlot: item.available_slot,
    userMaxTicketPurchase: item.user_max_ticket_purchase,
  };
};

export const eventService = {
  // Caching for DiscoverScreen list
  getCachedEvents: async (): Promise<Event[]> => await storageService.getItem<Event[]>(storageKeys.getEventsCacheKey()) || [],
  cacheEvents: (events: Event[]) => storageService.setItem(storageKeys.getEventsCacheKey(), events),
  getLastSyncTimestamp: () => storageService.getItem<string>(storageKeys.getEventsSyncKey()),
  setLastSyncTimestamp: (ts: string) => storageService.setItem(storageKeys.getEventsSyncKey(), ts),


  async fetchEvents(page: number, limit: number, query: string, category: string, lastSyncTimestamp: string | null): Promise<{ events: Event[], totalCount: number }> {
    const { data, error } = await supabase.rpc('get_paginated_events', {
      p_page: page,
      p_limit: limit,
      p_query: query,
      p_category: category,
      p_last_updated: lastSyncTimestamp
    });

    if (error) throw error;
    
    const result = data[0] || { events: [], total_count: 0 };
    const events = (result.events || []).map(mapSupabaseToEvent);
    
    // Proactively cache the full details of all fetched events.
    await cacheEventDetails(events);
    
    return {
      events: events,
      totalCount: result.total_count
    };
  },

  async getLatestEventTimestamp(): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_latest_event_timestamp').single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as string | null;
  },
  
  async fetchEventById(id: number): Promise<Event | null> {
    // Check the detailed cache first. This is now the primary source.
    const detailCache = await getDetailCache();
    if (detailCache[id]) {
      return detailCache[id];
    }

    //  If not in the cache and offline, do nothing.
    if (!useNetworkStatus.getState().isConnected) {
      return null;
    }

    // If online and not in cache, fetch from the server.
    const { data, error } = await supabase.rpc('get_events_by_ids', { event_ids: [id] });
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const event = mapSupabaseToEvent(data[0]);
    // Save the newly fetched event to the detailed cache for future use.
    await cacheEventDetails([event]);
    return event;
  },

  async fetchEventsByIds(ids: number[]): Promise<Event[]> {
    if (ids.length === 0) return [];
    const detailCache = await getDetailCache();
    const cachedEvents = ids.map(id => detailCache[id]).filter(Boolean) as Event[];
    const cachedIds = new Set(cachedEvents.map(e => e.id));
    const idsToFetch = ids.filter(id => !cachedIds.has(id));

    if (idsToFetch.length === 0) return cachedEvents;

    if (useNetworkStatus.getState().isConnected) {
        try {
            const { data, error } = await supabase.rpc('get_events_by_ids', { event_ids: idsToFetch });
            if (error) throw error;
            const fetchedEvents = data.map(mapSupabaseToEvent);
            // Also cache these details.
            await cacheEventDetails(fetchedEvents);
            return [...cachedEvents, ...fetchedEvents];
        } catch (error) {
            console.error("Failed to fetch events by IDs, returning cached only.", error);
            return cachedEvents;
        }
    }
    return cachedEvents;
  },

   async fetchCategories(): Promise<string[]> {
    if (!useNetworkStatus.getState().isConnected) {
      return ['All', 'Music', 'Technology', 'Food & Drink', 'Arts & Culture'];
    }
    const { data, error } = await supabase.rpc('get_distinct_categories');
    if (error) {
      console.error("Failed to fetch categories:", error.message);
      return ['All', 'Music', 'Technology', 'Food & Drink', 'Arts & Culture'];
    }
    const categoryNames = data.map((c: { category: string }) => c.category);
    return ['All', ...categoryNames];
  },
};

