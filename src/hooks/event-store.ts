import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import { Event } from '@/src/types/event';
import { User }  from '@/src/types/user';

const EVENTS_PER_PAGE = 5;

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
  organizer: item.profiles ? {
    id: item.profiles.id,
    fullName: item.profiles.full_name, 
    email: item.profiles.email, 
    avatar: item.profiles.avatar_url,   
  } : {
    id: '00000000-0000-0000-0000-000000000000',
    fullName: 'Unknown User',
    email: '',
    avatar: undefined,
  },
  capacity: item.capacity,
  attendees: item.attendees,
  tags: item.tags,
});

type EventsState = {
  events: Event[];
  categories: string[];
  favoriteEvents: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isPaginating: boolean;
  error: string | null;
  hasMore: boolean;
  fetchEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchMoreEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchFavoriteEvents: (ids: number[]) => Promise<void>; 
  fetchEventById: (id: number) => Promise<void>; 
  fetchCategories: () => Promise<void>;
};

export const useEvents = create<EventsState>()((set, get) => ({
  events: [],
  categories: ['All'],
  favoriteEvents: [],
  currentEvent: null,
  isLoading: false,
  isPaginating: false,
  error: null,
  hasMore: true,

  fetchEventById: async (id: number) => { 
    set({ isLoading: true, error: null, currentEvent: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_organizers (
            profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const organizerProfile = data.event_organizers[0]?.profiles;

      const mappedEvent = mapSupabaseToEvent({
        ...data,
        profiles: organizerProfile,
      });

      set({ currentEvent: mappedEvent, isLoading: false });

    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  fetchFavoriteEvents: async (ids: number[]) => {
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
      
      // map the organizer data 
      const mappedData = data.map(item => mapSupabaseToEvent(item));
      set({ favoriteEvents: mappedData, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  fetchEvents: async ({ query, category }) => {
    set({ isLoading: true, error: null, events: [] });
    try {
      let supabaseQuery = supabase.from('events').select('*, profiles:event_organizers(profiles(id, full_name, avatar_url))');

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
      
      const mappedData = data.map(item => mapSupabaseToEvent({ ...item, profiles: item.profiles[0]?.profiles }));
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
      const from = (currentPage + 1) * EVENTS_PER_PAGE;
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
      
      const mappedData = data.map(item => mapSupabaseToEvent({ ...item, profiles: item.profiles[0]?.profiles }));
      set((state) => ({
        events: [...state.events, ...mappedData],
        isPaginating: false,
        hasMore: data.length === EVENTS_PER_PAGE,
      }));
    } catch (err: any) {
      set({ error: err.message, isPaginating: false });
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase.rpc('get_distinct_categories');

      if (error) throw error;
      
      const categoryNames = data.map((c: { category: string }) => c.category);
      set({ categories: ['All', ...categoryNames] });

    } catch (err: any) {
      console.error("Failed to fetch categories:", err.message);
    }
  }
}));

