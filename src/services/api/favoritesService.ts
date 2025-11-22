import { supabase } from '../../lib/supabase';
import * as sqliteService from '../sqliteService';
import { useNetworkStatus } from '../../stores/network-store';
import { fetchEventsByIds } from './eventService'; 

export async function getFavorites(): Promise<number[]> {
  const isConnected = useNetworkStatus.getState().isConnected;

  // Try Network (if online)
  if (isConnected) {
    try {
      console.log('[favoritesService] Online. Fetching favorites from Supabase...');
      const { data, error } = await supabase.rpc('get_user_favorites');
      if (error) throw error;

      const serverIds = data.map((fav: { event_id: any }) => Number(fav.event_id));
      console.log(`[favoritesService] Received ${serverIds.length} IDs from server:`, serverIds);

      // Save IDs to SQLite
      await sqliteService.saveFavoriteIds(serverIds);

      // Pre-cache Details (so offline view works immediately)
      if (serverIds.length > 0) {
        console.log(`[favoritesService] Pre-caching details...`);
        try {
          await fetchEventsByIds(serverIds);
          console.log('[favoritesService] Pre-caching complete.');
        } catch (err) {
          console.warn('[favoritesService] Failed to pre-cache details:', err);
        }
      }

      return serverIds;
    } catch (error) {
      console.warn('[favoritesService] Network failed. Attempting cache fallback.', error);
    }
  }

  // Fallback to Cache
  console.log('[favoritesService] Fetching from SQLite cache...');
  const cachedIds = await sqliteService.getFavoriteIds();
  console.log(`[favoritesService] Returning ${cachedIds.length} IDs from cache.`);
  return cachedIds;
}

export async function addFavorite(eventId: number): Promise<void> {
  const isConnected = useNetworkStatus.getState().isConnected;
  if (!isConnected) throw new Error('You are offline. Cannot update favorites.');

  const { error } = await supabase.rpc('add_favorite', { p_event_id: eventId });
  if (error) throw error;

  const currentIds = await sqliteService.getFavoriteIds();
  if (!currentIds.includes(eventId)) {
    await sqliteService.saveFavoriteIds([...currentIds, eventId]);
    fetchEventsByIds([eventId]).catch(console.warn);
  }
}

export async function removeFavorite(eventId: number): Promise<void> {
  const isConnected = useNetworkStatus.getState().isConnected;
  if (!isConnected) throw new Error('You are offline. Cannot update favorites.');

  const { error } = await supabase.rpc('remove_favorite', { p_event_id: eventId });
  if (error) throw error;

  const currentIds = await sqliteService.getFavoriteIds();
  await sqliteService.saveFavoriteIds(currentIds.filter((id) => id !== eventId));
}