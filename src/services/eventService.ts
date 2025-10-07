import { supabase } from '@/src/lib/supabase';
import { Event } from '@/src/types/event';

const EVENTS_PER_PAGE = 5;

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
    let supabaseQuery = supabase
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
      .order('start_time', { ascending: true })
      .range(page * EVENTS_PER_PAGE, (page + 1) * EVENTS_PER_PAGE - 1);

    if (query) {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }
    if (category && category !== 'All') {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data, error } = await supabaseQuery;
    if (error) throw new Error(error.message);

    return data.map(mapSupabaseToEvent);
  },

  async fetchEventById(id: number): Promise<Event | null> {
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

    if (error) throw new Error(error.message);
    return data ? mapSupabaseToEvent(data) : null;
  },

  async fetchFavoriteEvents(ids: number[]): Promise<Event[]> {
    if (ids.length === 0) return [];

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
      .in('id', ids);

    if (error) throw new Error(error.message);
    return data.map(mapSupabaseToEvent);
  },

  async fetchCategories(): Promise<string[]> {
    // Assuming you have a RPC function in Supabase for this.
    // If not, you can create one or query the distinct categories.
    const { data, error } = await supabase.rpc('get_distinct_categories');
    if (error) {
        console.error("Failed to fetch categories via RPC, using fallback.", error);
        // Fallback if RPC doesn't exist
        const { data: catData, error: catError } = await supabase.from('events').select('category');
        if (catError) throw new Error(catError.message);
        const uniqueCategories = [...new Set(catData.map(item => item.category))];
        return ['All', ...uniqueCategories];
    }
    return ['All', ...data.map((c: { category: string }) => c.category)];
  },
};

