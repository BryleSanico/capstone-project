import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import { Event } from '@/src/types/event';

const EVENTS_PER_PAGE = 5;

type EventsState = {
  events: Event[];
  categories: string[]; // To store dynamic categories
  favoriteEvents: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isPaginating: boolean;
  error: string | null;
  hasMore: boolean;
  fetchEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchMoreEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchFavoriteEvents: (ids: string[]) => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>; // New function for categories
};

const mapSupabaseToEvent = (item: any): Event => ({
  id: item.id,
  title: item.title,
  description: item.description,
  imageUrl: item.image_url,
  startTime: item.start_time,
  location: item.location,
  address: item.address,
  price: item.price,
  category: item.category,
  organizer: item.organizer,
  capacity: item.capacity,
  attendees: item.attendees,
  tags: item.tags,
});

export const useEvents = create<EventsState>()((set, get) => ({
  events: [],
  categories: ['All'], // Initialize with 'All'
  favoriteEvents: [],
  currentEvent: null,
  isLoading: false,
  isPaginating: false,
  error: null,
  hasMore: true,

  fetchEvents: async ({ query, category }) => {
    set({ isLoading: true, error: null, events: [] });
    try {
      let supabaseQuery = supabase.from('events').select('*');

      // Use .ilike() for partial, case-insensitive string matching.
      // The '%' are wildcards, so it finds any event containing the query text.
      if (query) {
        supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
      }
      if (category && category !== 'All') {
        supabaseQuery = supabaseQuery.eq('category', category);
      }

      const { data, error } = await supabaseQuery
        .order('start_time', { ascending: true })
        .range(0, EVENTS_PER_PAGE - 1);

      if (error) throw error;
      
      const mappedData = data.map(mapSupabaseToEvent);
      set({
        events: mappedData,
        isLoading: false,
        hasMore: data.length === EVENTS_PER_PAGE,
      });
    } catch (err: any) {
      set({ error: `Something went wrong. ${err.message}`, isLoading: false });
    }
  },

  fetchMoreEvents: async ({ query, category }) => {
    const { events, isPaginating } = get();
    if (isPaginating) return;

    set({ isPaginating: true });
    try {
      const currentPage = Math.floor(events.length / EVENTS_PER_PAGE);
      const from = (currentPage + 1) * EVENTS_PER_PAGE - EVENTS_PER_PAGE;
      const to = from + EVENTS_PER_PAGE - 1;

      let supabaseQuery = supabase.from('events').select('*');

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
      
      const mappedData = data.map(mapSupabaseToEvent);
      set((state) => ({
        events: [...state.events, ...mappedData],
        isPaginating: false,
        hasMore: data.length === EVENTS_PER_PAGE,
      }));
    } catch (err: any) {
      set({ error: err.message, isPaginating: false });
    }
  },
  
  fetchFavoriteEvents: async (ids: string[]) => {
     if (ids.length === 0) {
      set({ favoriteEvents: [], isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', ids);

      if (error) throw error;

      const mappedData = data.map(mapSupabaseToEvent);
      set({ favoriteEvents: mappedData, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchEventById: async (id: string) => {
    set({ isLoading: true, error: null, currentEvent: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const mappedEvent = mapSupabaseToEvent(data);
      set({ currentEvent: mappedEvent, isLoading: false });

    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // New function to get all unique categories from the database
  fetchCategories: async () => {
    try {
      // Use an RPC call to a database function to get distinct categories
      const { data, error } = await supabase.rpc('get_distinct_categories');

      if (error) throw error;
      
      const categoryNames = data.map((c: { category: string }) => c.category);
      set({ categories: ['All', ...categoryNames] });

    } catch (err: any) {
      console.error("Failed to fetch categories:", err.message);
    }
  }
}));

// IMPORTANT: You need to run the following SQL in your Supabase SQL Editor ONE TIME
// to create the `get_distinct_categories` function.
/*
  create or replace function get_distinct_categories()
  returns table(category text) as $$
  begin
    return query
      select distinct T.category from events T order by 1;
  end;
  $$ language plpgsql;
*/

