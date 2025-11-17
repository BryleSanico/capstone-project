import { supabase } from '../../lib/supabase';
import * as sqliteService from '../sqliteService';

/**
 * Fetches the user's list of favorite event IDs.
 */
export async function getFavorites(): Promise<number[]> {
  const { data, error } = await supabase.rpc('get_user_favorites');
  if (error) throw error;

  const serverIds = data.map((fav: { event_id: number }) => fav.event_id);
  
  // Insert to SQLite database
  await sqliteService.saveFavoriteIds(serverIds);
  return serverIds;
}

/**
 * Adds a single event to the user's favorites.
 */
export async function addFavorite(eventId: number): Promise<void> {
  const { error } = await supabase.rpc('add_favorite', {
    p_event_id: eventId,
  });
  if (error) throw error;

  // Optimistically update the SQLite cache
  // before invalidating
  const currentIds = await sqliteService.getFavoriteIds();
  if (!currentIds.includes(eventId)) {
    await sqliteService.saveFavoriteIds([...currentIds, eventId]);
  }
}

/**
 * Removes a single event from the user's favorites.
 */
export async function removeFavorite(eventId: number): Promise<void> {
  const { error } = await supabase.rpc('remove_favorite', {
    p_event_id: eventId,
  });
  if (error) throw error;

  // Optimistic cache update
  const currentIds = await sqliteService.getFavoriteIds();
  const newIds = currentIds.filter(id => id !== eventId);
  await sqliteService.saveFavoriteIds(newIds);
}