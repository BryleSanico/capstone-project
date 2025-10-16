import storageService from './storageService';
import { storageKeys } from '../utils/storageKeys';

/**
 * Manages the clearing of user-specific data from local storage on sign-out.
 */
export const cacheManager = {
  async clearUserSpecificCache(userId: string) {
    if (!userId) return;
    
    const keysToRemove = [
      storageKeys.getTicketsCacheKey(userId),
      storageKeys.getTicketsSyncKey(userId),
    ];

    console.log("Clearing user-specific cache (tickets only) for user:", userId);
    for (const key of keysToRemove) {
      await storageService.removeItem(key);
    }
  },
};

