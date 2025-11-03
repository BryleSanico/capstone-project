import { supabase } from "../lib/supabase";
import { eventService } from "./eventService";
import { getCurrentSession } from "../utils/system/sessionHelper";
import storageService from "./storageService";
import { storageKeys } from "../utils/cache/storageKeys";
import { useNetworkStatus } from "../stores/network-store";
import { Event } from "../types/event";
import { withRetry } from "../utils/network/networkUtils";

type CachedFavorites = {
  ids: number[];
  lastUpdatedAt: number;
};

const CACHE_EXPIRATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// --- "Private" Methods ---
// Defined as standalone functions

/**
 * [PRIVATE] Fetches the user's complete list of favorite event IDs from the server.
 */
async function getFavorites(): Promise<number[]> {
  const { data, error } = await withRetry(() =>
  supabase.rpc("get_user_favorites", {
    last_sync_time: null, // Pass null to get the full list
  }));

  if (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
  return data.map((fav: { event_id: number }) => fav.event_id);
}

/**
 * [PRIVATE] Sends the calculated changes (additions and removals) to the database.
 */
async function syncFavorites(
  userId: string,
  addedIds: number[],
  removedIds: number[]
): Promise<void> {
  if (addedIds.length === 0 && removedIds.length === 0) {
    return; // No changes to sync
  }

  const { error } = await withRetry(() =>
  supabase.rpc("batch_update_favorites", {
    p_user_id: userId,
    p_added_ids: addedIds,
    p_removed_ids: removedIds,
  })
);

  if (error) {
    console.error("Error batch syncing favorites:", error);
    throw error;
  }
}

// --- "Public" Methods ---

/**
 * Loads favorite events, applying cache-first logic.
 * 1. Tries fresh cache
 * 2. Falls back to network
 * 3. Falls back to stale cache (if offline)
 */
async function getFavoriteEvents(): Promise<{
  events: Event[];
  ids: number[];
}> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { events: [], ids: [] };
  }

  const favoritesCacheKey = storageKeys.getFavoritesIdsKey(userId);
  const cachedData = await storageService.getItem<CachedFavorites>(
    favoritesCacheKey
  );
  const isCacheExpired =
    !cachedData ||
    Date.now() - cachedData.lastUpdatedAt > CACHE_EXPIRATION_DURATION;
  const isConnected = useNetworkStatus.getState().isConnected;

  let eventIds: number[] = [];

  if (cachedData && !isCacheExpired) {
    console.log("[Favorites] Loading from fresh cache.");
    eventIds = cachedData.ids;
  } else if (isConnected) {
    console.log("[Favorites] Cache expired/missing. Fetching from server.");
    try {
      // Call the standalone getFavorites() function
      eventIds = await getFavorites();
      await storageService.setItem(favoritesCacheKey, {
        ids: eventIds,
        lastUpdatedAt: Date.now(),
      });
    } catch (error) {
      console.error(
        "Failed to load favorites from server, falling back to stale cache if available.",
        error
      );
      eventIds = cachedData?.ids || [];
    }
  } else if (cachedData) {
    console.log("[Favorites] Offline. Loading from stale cache.");
    eventIds = cachedData.ids;
  }

  if (eventIds.length === 0) {
    return { events: [], ids: [] };
  }

  // Calls eventService (no circular dependency)
  const events = await eventService.fetchEventsByIds(eventIds);
  return { events, ids: eventIds };
}

/**
 * Calculates diff and syncs changes with the server.
 * @returns The new "initial" set of favorites after a successful sync.
 */
async function syncFavoriteChanges(
  userId: string,
  finalFavorites: number[],
  initialFavorites: Set<number>
): Promise<Set<number>> {
  const currentSet = new Set(finalFavorites);
  const added = finalFavorites.filter((id) => !initialFavorites.has(id));
  const removed = Array.from(initialFavorites).filter(
    (id) => !currentSet.has(id)
  );

  if (added.length === 0 && removed.length === 0) {
    console.log("[Favorites] Sync skipped, no changes.");
    return initialFavorites;
  }

  // Call the standalone syncFavorites() function
  await syncFavorites(userId, added, removed);

  const favoritesCacheKey = storageKeys.getFavoritesIdsKey(userId);
  await storageService.setItem(favoritesCacheKey, {
    ids: finalFavorites,
    lastUpdatedAt: Date.now(),
  });

  console.log(
    `[Favorites] Sync successful. Added: ${added.length}, Removed: ${removed.length}`
  );
  return currentSet;
}

export const favoritesService = {
  getFavorites,
  syncFavorites,
  getFavoriteEvents,
  syncFavoriteChanges,
};
