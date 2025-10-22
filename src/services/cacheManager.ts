import storageService from './storageService';
import { storageKeys } from '../utils/storageKeys';

/**
 * Manages the clearing of user-specific data from local storage on sign-out.
 */
export const cacheManager = {
  async clearUserSpecificCache(userId: string) {
    if (!userId) return;
    
    // FIX: Add favorites keys to ensure all user-specific data is cleared.
    const keysToRemove = [
      storageKeys.getTicketsCacheKey(userId),
      storageKeys.getTicketsSyncKey(userId),
      storageKeys.getFavoritesIdsKey(userId),
      storageKeys.getFavoritesSyncKey(userId),
    ];

    console.log("Clearing user-specific cache (tickets, favorites) for user:", userId);
    // Use Promise.all for more efficient parallel removal.
    await Promise.all(
        keysToRemove.map(key => storageService.removeItem(key))
    );
  },
};
