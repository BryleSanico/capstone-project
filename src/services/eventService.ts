import { supabase } from "../lib/supabase";
import { Event } from "../types/event";
import storageService from "./storageService";
import { useNetworkStatus } from "../stores/network-store";
import { storageKeys } from "../utils/storageKeys";
import { eventMapper } from "../utils/mappers/eventMapper";
import { mergeAndDedupeEvents } from "../utils/cacheUtils";
import { prefetchImages } from "../utils/caching/imageCache";
import { withRetry } from "../utils/networkUtils";

const EVENTS_PER_PAGE = 3;

// --- "Private" Helpers ---
/**
 * Gets the detailed event cache (normalized).
 * @returns A record map of eventId -> Event.
 */
async function getDetailCache(): Promise<Record<number, Event>> {
  return (
    (await storageService.getItem<Record<number, Event>>(
      storageKeys.getEventsDetailCacheKey()
    )) || {}
  );
}

/**
 * Saves one or more events to the detailed event cache.
 * @param events An array of events to save.
 */
async function cacheEventDetails(events: Event[]) {
  if (events.length === 0) return;
  const cache = await getDetailCache();
  events.forEach((event) => {
    cache[event.id] = event;
  });
  await storageService.setItem(storageKeys.getEventsDetailCacheKey(), cache);
}

/**
 * Gets the ordered list of event IDs for the Discover screen.
 * @returns An array of event IDs.
 */
async function getCachedEventListIds(): Promise<number[]> {
  return (
    (await storageService.getItem<number[]>(storageKeys.getEventsCacheKey())) ||
    []
  );
}

/**
 * Saves the ordered list of event IDs for the Discover screen.
 * @param ids An array of event IDs.
 */
async function cacheEventListIds(ids: number[]) {
  return storageService.setItem(storageKeys.getEventsCacheKey(), ids);
}

/**
 * Hydrates full event objects from a list of IDs using the detail cache.
 * @param ids An array of event IDs.
 * @returns An array of full Event objects.
 */
async function hydrateEventsFromCache(ids: number[]): Promise<Event[]> {
  const detailCache = await getDetailCache();
  // Filter out any IDs that might not be in the cache (though they should be)
  return ids.map((id) => detailCache[id]).filter(Boolean) as Event[];
}

// --- "Public" Methods ---

async function clearCachedEvents() {
  return storageService.removeItem(storageKeys.getEventsCacheKey());
}

async function clearCachedEventDetails() {
  return storageService.removeItem(storageKeys.getEventsDetailCacheKey());
}

async function getLastSyncTimestamp() {
  return storageService.getItem<string>(storageKeys.getEventsSyncKey());
}

async function setLastSyncTimestamp(ts: string) {
  return storageService.setItem(storageKeys.getEventsSyncKey(), ts);
}

// --- Core Network Fetching ---

/**
 * Fetches events from the server using RPC.
 */
async function fetchEvents(params: {
  page?: number | null;
  limit?: number | null;
  query?: string;
  category?: string;
  lastSyncTimestamp?: string | null;
}): Promise<{ events: Event[]; totalCount: number }> {
  const { data, error } = await withRetry(() => 
    supabase.rpc("get_paginated_events", {
      p_page: params.page ?? null,
      p_limit: params.limit ?? null,
      p_query: params.query ?? "",
      p_category: params.category ?? "All",
      p_last_updated: params.lastSyncTimestamp ?? null,
    })
  );

  if (error) throw error;

  const result = data[0] || { events: [], total_count: 0 };
  const events: Event[] = (result.events || []).map(eventMapper);

  if (params.page === 1) {
    await storageService.setItem(
      storageKeys.getEventsTotalCountKey(),
      result.total_count
    );
  }

  await cacheEventDetails(events); // Automatically cache the detailed data for any event that fetched  
  return {
    events: events,
    totalCount: result.total_count,
  };
}

/**
 * Fetches only updated events (based on cached IDs and updated_at timestamp).
 */
async function fetchUpdatedCachedEvents(
  cachedIds: number[],
  lastSyncTimestamp: string
): Promise<Event[]> {
  if (cachedIds.length === 0) return [];

  const { data, error } = await withRetry(() => 
    supabase.rpc("get_updated_cached_events", {
      p_event_ids: cachedIds,
      p_last_updated: lastSyncTimestamp,
    })
  );

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const events = data.map(eventMapper);
  await cacheEventDetails(events); // Cache the updated details
  // Asynchronously prefetch images for the fetched events.
  prefetchImages(events.map((e: Event) => e.imageUrl)).catch((err: any) => {
    console.warn("[ImageCache] Background prefetch failed for sync:", err);
  });
  return events;
}

async function getLatestEventTimestamp(): Promise<string | null> {
  const { data, error } = await withRetry(() => 
    supabase
      .rpc("get_latest_event_timestamp")
      .single()
  );
  if (error && error.code !== "PGRST116") throw error;
  return data as string | null;
}

/**
 * Loads initial events.
 * Tries cache first, then falls back to network.
 */
async function getInitialEvents(filters: {
  query: string;
  category: string;
}): Promise<{ events: Event[]; total: number }> {
  const cachedEventIds = await getCachedEventListIds();

  if (cachedEventIds.length > 0 && useNetworkStatus.getState().isConnected) {
    console.log(
      `[Initial Load] Found ${cachedEventIds.length} event IDs in list cache. Hydrating...`
    );
    const cachedEvents = await hydrateEventsFromCache(cachedEventIds);
    // Load the *real* total saved from our last network fetch.
    const storedTotal = await storageService.getItem<number>(
      storageKeys.getEventsTotalCountKey()
    );
    // Fallback: If nothing is stored, default to the cache length.
    const total = storedTotal ?? cachedEvents.length;

    return { events: cachedEvents, total: total };
  }

  if (!useNetworkStatus.getState().isConnected) {
    throw new Error("You are offline.");
  }

  console.log("[Initial Load] No cache. Fetching from server...");
  // Call the standalone fetchEvents() function
  const { events: firstPageEvents, totalCount } = await fetchEvents({
    page: 1,
    limit: EVENTS_PER_PAGE,
    query: filters.query,
    category: filters.category,
  });

   if (firstPageEvents.length > 0) {
    console.log(`[Initial Load] Prefetching ${firstPageEvents.length} new images...`);
    try {
      await prefetchImages(firstPageEvents.map((e: Event) => e.imageUrl));
      console.log("[Initial Load] Image prefetch complete.");
    } catch (err: any) {
      console.warn("[Initial Load] Image prefetch failed, but proceeding:", err);
    }
  }
  await cacheEventListIds(firstPageEvents.map((e) => e.id));

  return { events: firstPageEvents, total: totalCount };
}

/**
 * Fetches the next page of events from the network and caches them.
 */
async function getMoreEvents(
  filters: { query: string; category: string },
  currentPage: number,
  currentFullCache: Event[]
): Promise<{ events: Event[]; total: number }> {
  if (!useNetworkStatus.getState().isConnected) {
    throw new Error("Offline. Cannot load more.");
  }

  console.log("[Load More] Fetching new events from server...");

  const nextPage = currentPage + 1;
  // Call the standalone fetchEvents() function
  const { events: newEvents, totalCount } = await fetchEvents({
    page: nextPage,
    limit: EVENTS_PER_PAGE,
    query: filters.query,
    category: filters.category,
  });

  if (newEvents.length > 0) {
    // Await the prefetching of new images *before* updating the cache and state
    console.log(`[Load More] Prefetching ${newEvents.length} new images...`);
    try {
      await prefetchImages(newEvents.map((e: Event) => e.imageUrl));
      console.log("[Load More] Image prefetch complete.");
    } catch (err: any) {
      console.warn("[Load More] Image prefetch failed, but proceeding:", err);
    }
    const updatedFullCache = mergeAndDedupeEvents(currentFullCache, newEvents);
    await cacheEventListIds(updatedFullCache.map((e) => e.id));
    return { events: updatedFullCache, total: totalCount };
  } else {
    return { events: currentFullCache, total: totalCount };
  }
}

/**
 * Fetches a single event by ID.
 * Tries detail cache first, then falls back to network.
 */
async function fetchEventById(id: number): Promise<Event | null> {
  const detailCache = await getDetailCache();
  if (detailCache[id]) {
    console.log(`[Fetch By ID] Found event ${id} in detail cache.`);
    return detailCache[id];
  }

  if (!useNetworkStatus.getState().isConnected) {
    return null;
  }

  console.log(
    `[Fetch By ID] Event ${id} not in cache. Fetching from network...`
  );
  const { data, error } = await withRetry(() => 
    supabase.rpc("get_events_by_ids", {
      event_ids: [id],
    })
  );
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const event = eventMapper(data[0]);
  await cacheEventDetails([event]);
  // Asynchronously prefetch images for the fetched events.
  prefetchImages([event.imageUrl]).catch((err: any) => {
    console.warn("[ImageCache] Background prefetch failed for fetchEventById:", err);
  });
  return event;
}

/**
 * Fetches a list of events by their IDs.
 * Tries detail cache first, then falls back to network for missing ones.
 */
async function fetchEventsByIds(ids: number[]): Promise<Event[]> {
  if (ids.length === 0) return [];

  const detailCache = await getDetailCache();

  const cachedEvents: Event[] = [];
  const idsToFetch: number[] = [];

  for (const id of ids) {
    if (detailCache[id]) {
      cachedEvents.push(detailCache[id]);
    } else {
      idsToFetch.push(id);
    }
  }

  if (idsToFetch.length === 0) {
    return cachedEvents;
  }

  if (useNetworkStatus.getState().isConnected) {
    try {
      console.log(
        `[Fetch By IDs] Fetching ${idsToFetch.length} events from network.`
      );
      const { data, error } = await withRetry(() => 
        supabase.rpc("get_events_by_ids", {
          event_ids: idsToFetch,
        })
      );
      if (error) throw error;

      const fetchedEvents = data.map(eventMapper);
      await cacheEventDetails(fetchedEvents);
      // Asynchronously prefetch images for the fetched events.
      prefetchImages(fetchedEvents.map((e: Event) => e.imageUrl)).catch((err: any) => {
        console.warn("[ImageCache] Background prefetch failed for fetchEventsByIds:", err);
      });
      return [...cachedEvents, ...fetchedEvents];
    } catch (error) {
      console.error(
        "Failed to fetch events by IDs, returning cached only.",
        error
      );
      return cachedEvents;
    }
  }

  return cachedEvents;
}

/**
 * Synchronizes the local cache with the server.
 */
async function syncEventCache(
  currentFullCache: Event[]
): Promise<Event[] | null> {
  if (!useNetworkStatus.getState().isConnected) {
    throw new Error("Offline. Cannot sync.");
  }

  const cachedIds = currentFullCache.map((e) => e.id);
  if (cachedIds.length === 0) {
    console.log("[Sync] No cached events available for comparison.");
    return null;
  }

  // Get timestamp of last sync
  const localTimestamp = await getLastSyncTimestamp();
  const serverTimestamp = await getLatestEventTimestamp();

  if (
    serverTimestamp &&
    localTimestamp &&
    new Date(localTimestamp) >= new Date(serverTimestamp)
  ) {
    console.log("[Sync] Local cache is already up-to-date.");
    return null;
  }

  // Call standalone helper function
  const updatedEvents = await fetchUpdatedCachedEvents(
    cachedIds,
    localTimestamp || "2025-01-01T00:00:00Z"
  );

  if (updatedEvents.length > 0) {
    console.log(
      `[Sync] Found ${updatedEvents.length} updated events from server.`
    );

    const mergedEvents = mergeAndDedupeEvents(currentFullCache, updatedEvents);

    await cacheEventListIds(mergedEvents.map((e) => e.id));

    if (serverTimestamp) {
      await setLastSyncTimestamp(serverTimestamp);
    }
    const visibleEvents = mergedEvents.slice(0, EVENTS_PER_PAGE * 2);
    await prefetchImages(visibleEvents.map(e => e.imageUrl));
  
    return mergedEvents;
  } else {
    console.log("[Sync] No cached events required updates.");
    if (serverTimestamp) {
      await setLastSyncTimestamp(serverTimestamp);
    }
    return null;
  }
}

/**
 * Clears all local event caches and re-fetches the first page.
 */
async function refreshEventCache(filters: {
  query: string;
  category: string;
}): Promise<{ events: Event[]; total: number }> {
  if (!useNetworkStatus.getState().isConnected) {
    throw new Error("You are offline.");
  }

  console.log("[Refresh] Clearing event caches.");
  await clearCachedEvents();
  return getInitialEvents(filters);
}

export const eventService = {
  eventMapper,
  clearCachedEvents,
  clearCachedEventDetails,
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  cacheEventDetails,
  fetchEvents,
  fetchUpdatedCachedEvents,
  getLatestEventTimestamp,
  getInitialEvents,
  getMoreEvents,
  fetchEventById,
  fetchEventsByIds,
  syncEventCache,
  refreshEventCache,
};
