import { supabase } from '../lib/supabase';

export const favoritesService = {
  // Fetches the numeric IDs of the user's favorite events
  async getFavorites(): Promise<number[]> {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('event_id');

    if (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }

    return data.map(fav => fav.event_id);
  },

  // Adds an event to the user's favorites
  async addFavorite(eventId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .insert({ event_id: eventId, user_id: userId });

    if (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  },

  // Removes an event from the user's favorites
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
