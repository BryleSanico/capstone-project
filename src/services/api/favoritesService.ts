import { supabase } from '../../lib/supabase';

/**
 * Fetches the user's list of favorite event IDs.
 */
export async function getFavorites(): Promise<number[]> {
  const { data, error } = await supabase.rpc('get_user_favorites');
  if (error) throw error;
  return data.map((fav: { event_id: number }) => fav.event_id);
}

/**
 * Adds a single event to the user's favorites.
 */
export async function addFavorite(eventId: number): Promise<void> {
  const { error } = await supabase.rpc('add_favorite', {
    p_event_id: eventId,
  });
  if (error) throw error;
}

/**
 * Removes a single event from the user's favorites.
 */
export async function removeFavorite(eventId: number): Promise<void> {
  const { error } = await supabase.rpc('remove_favorite', {
    p_event_id: eventId,
  });
  if (error) throw error;
}