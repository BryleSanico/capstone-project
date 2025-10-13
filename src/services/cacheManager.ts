import storageService from './storageService';
import { storageKeys } from '../utils/storageKeys';

/**
 * Manages the clearing of user-specific data from local storage.
 * This is called on sign-out to ensure no data is left behind between sessions.
 */
export const cacheManager = {
  async clearUserSpecificCache(userId: string) {
    if (!userId) return;

    // List all user-specific keys that need to be cleared.
    // The general events cache is intentionally left out, as it's not user-specific.
    const keysToRemove = [
      storageKeys.getFavoritesIdsKey(userId),
      storageKeys.getFavoritesSyncKey(userId),
      storageKeys.getTicketsCacheKey(userId),
      storageKeys.getTicketsSyncKey(userId),
    ];

    console.log("Clearing user-specific cache for user:", userId);
    for (const key of keysToRemove) {
      await storageService.removeItem(key);
    }
  },
};
