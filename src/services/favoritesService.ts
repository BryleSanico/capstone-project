import { supabase } from '../lib/supabase';

export const favoritesService = {
  // Fetches the numeric IDs of the user's favorite events using RPC function
  async getFavorites(lastSyncTimestamp: string | null): Promise<number[]> {
    const { data, error } = await supabase.rpc('get_user_favorites', {
      last_sync_time: lastSyncTimestamp
    });

    if (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }

    return data.map((fav: { event_id: number }) => fav.event_id);
  },

  // Get the most recent favorite timestamp for sync purposes
  async getLatestFavoriteTimestamp(): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_latest_favorite_timestamp').single();
    
    if (error) {
        // Ignore RLS policy if no rows are returned, means the table is empty.
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error("Error fetching latest favorite timestamp:", error);
        throw error;
    }
    return data as string | null;
  },

  async addFavorite(eventId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .insert({ event_id: eventId, user_id: userId });

    if (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  },

  async removeFavorite(eventId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  },
};
