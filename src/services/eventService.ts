import { supabase } from '@/src/lib/supabase';
import { Event } from '@/src/types/event';
import storageService from './storageService';
import { useNetworkStatus } from '../stores/network-store';

const EVENTS_PER_PAGE = 5;
const EVENTS_CACHE_KEY = "events_cache";
const { isConnected } = useNetworkStatus.getState();

// Helper function to get the current event cache from storage
const getEventsCache = async (): Promise<Record<number, Event>> => {
  return await storageService.getItem<Record<number, Event>>(EVENTS_CACHE_KEY) || {};
};

// Helper function to save an event to the cache
const cacheEvent = async (event: Event) => {
  const cache = await getEventsCache();
  cache[event.id] = event;
  await storageService.setItem(EVENTS_CACHE_KEY, cache);
};

// This mapping function is now centralized in the service
const mapSupabaseToEvent = (item: any): Event => {
  // Gracefully handle the nested organizer profile data
  const organizerProfile = item.event_organizers?.[0]?.profiles || item.profiles;

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
      fullName: organizerProfile.full_name,
      email: organizerProfile.email || '', // Ensure email exists
      avatar: organizerProfile.avatar_url,
    } : {
      id: '00000000-0000-0000-0000-000000000000',
      fullName: 'Community Event',
      email: '',
      avatar: undefined,
    },
    capacity: item.capacity,
    attendees: item.attendees,
    tags: item.tags || [],
  };
};

export const eventService = {
  async fetchEvents(page: number, query: string, category: string): Promise<Event[]> {
    const from = page * EVENTS_PER_PAGE;
    const to = from + EVENTS_PER_PAGE - 1;

    let supabaseQuery = supabase.from('events').select('*, profiles:event_organizers(profiles(id, full_name, avatar_url))');

    if (query) {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }
    if (category && category !== 'All') {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data, error } = await supabaseQuery
      .order('start_time', { ascending: true })
      .range(from, to);

    if (error) throw error;
    
    return data.map(item => mapSupabaseToEvent({ ...item, profiles: item.profiles[0]?.profiles }));
  },

    async fetchEventById(id: number): Promise<Event | null> {


    if (isConnected) {
      const { data, error } = await supabase
        .from('events')
        .select(`*, profiles:event_organizers(profiles(id, full_name, avatar_url))`)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;

      const mappedEvent = mapSupabaseToEvent({ ...data, profiles: data.profiles[0]?.profiles });
      // We still cache when viewing details, as this is a strong user interest signal.
      await cacheEvent(mappedEvent);
      return mappedEvent;
    } else {
      console.log(`Offline mode: Fetching event ${id} from cache.`);
      const cache = await getEventsCache();
      return cache[id] || null;
    }
  },

    async fetchFavoriteEvents(ids: number[]): Promise<Event[]> {
    if (isConnected) {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles:event_organizers(profiles(id, full_name, avatar_url))')
        .in('id', ids);

      if (error) throw error;
      const mappedData = data.map(item => mapSupabaseToEvent({ ...item, profiles: item.profiles[0]?.profiles }));
      return mappedData;
    } else {
      console.log("Offline mode: Fetching favorite events from cache.");
      const cache = await getEventsCache();
      const cachedEvents = ids.map(id => cache[id]).filter(Boolean);
      return cachedEvents as Event[];
    }
  },

  async fetchCategories(): Promise<string[]> {
    // Only fetch categories if online
    if (!isConnected) {
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

