/**
 * A centralized utility for generating keys for AsyncStorage.
 * This prevents key name duplication and makes cache management easier.
 */
// User-specific prefixes
const USER_FAVORITES_IDS_KEY_PREFIX = "user_favorites_ids";
const LAST_FAVORITES_SYNC_KEY_PREFIX = "last_favorites_sync";
const USER_TICKETS_CACHE_KEY_PREFIX = "user_tickets_cache";
const LAST_TICKETS_SYNC_KEY_PREFIX = "last_tickets_sync";

// App-wide (non-user-specific) keys
const EVENTS_CACHE_KEY = "discover_events_cache";
const LAST_EVENTS_SYNC_KEY = "last_events_sync";
const EVENTS_DETAIL_CACHE_KEY = "events_detail_cache";


export const storageKeys = {
  // --- User-Specific Keys ---
  getFavoritesIdsKey: (userId: string) => `${USER_FAVORITES_IDS_KEY_PREFIX}_${userId}`,
  getFavoritesSyncKey: (userId: string) => `${LAST_FAVORITES_SYNC_KEY_PREFIX}_${userId}`,
  getTicketsCacheKey: (userId: string) => `${USER_TICKETS_CACHE_KEY_PREFIX}_${userId}`,
  getTicketsSyncKey: (userId: string) => `${LAST_TICKETS_SYNC_KEY_PREFIX}_${userId}`,

  // --- App-Wide Keys ---
  getEventsCacheKey: () => EVENTS_CACHE_KEY,
  getEventsSyncKey: () => LAST_EVENTS_SYNC_KEY,
  getEventsDetailCacheKey: () => EVENTS_DETAIL_CACHE_KEY,
};

