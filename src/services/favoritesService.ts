import { supabase } from '../lib/supabase';

export const favoritesService = {
  /**
   * Fetches the user's complete list of favorite event IDs from the server.
   * This is called on login to establish the initial session state.
   */
  async getFavorites(): Promise<number[]> {
    const { data, error } = await supabase.rpc('get_user_favorites', {
      last_sync_time: null // Pass null to get the full list
    });

    if (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
    // The RPC returns an array of objects like { event_id: 123 }, so we map it to a simple number array.
    return data.map((fav: { event_id: number }) => fav.event_id);
  },
  
  /**
   * Sends the calculated changes (additions and removals) to the database in a single batch.
   * This is called by the debounced sync logic in the favorites-store.
   */
  async syncFavorites(userId: string, addedIds: number[], removedIds: number[]): Promise<void> {
    if (addedIds.length === 0 && removedIds.length === 0) {
      return; // No changes to sync
    }
    
    const { error } = await supabase.rpc('batch_update_favorites', {
      p_user_id: userId,
      p_added_ids: addedIds,
      p_removed_ids: removedIds,
    });

    if (error) {
      console.error("Error batch syncing favorites:", error);
      throw error;
    }
  },
};

