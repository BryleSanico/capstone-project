import { supabase } from "../lib/supabase";
import { Event } from "../types/event";
import storageService from "./storageService";
import { useNetworkStatus } from "../stores/network-store";
import { storageKeys } from "../utils/cache/storageKeys";
import { eventMapper } from "../utils/mappers/eventMapper";
import { mergeAndDedupeEvents } from "../utils/cache/cacheUtils";
import { prefetchImages } from "../utils/cache/imageCache";
import { withRetry } from "../utils/network/networkUtils";
import * as eventCache from "./cache/eventCacheService";

const EVENTS_PER_PAGE = 3;

/**
 * Formats a plain text query into a tsquery string.
 * "Summer Festival" becomes "Summer:*" & "Festival:*"
 * This allows for multi-word and prefix matching.
 */
function formatQueryForTsquery(query: string): string {
  if (!query.trim()) {
    return "";
  }
  return query
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters
    .filter((word) => word.length > 0)
    .map((word) => word + ":*") // Add prefix match operator
    .join(" & "); // Join with AND operator
}

// --- Public Methods ---

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
    const formattedQuery = formatQueryForTsquery(params.query ?? "");
  const { data, error } = await withRetry(() =>
    supabase.rpc("get_paginated_events", {
      p_page: params.page ?? null,
      p_limit: params.limit ?? null,
      p_query: formattedQuery,
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

  // Automatically cache the detailed data for any event that fetched
  await eventCache.cacheEventDetails(events);
  return {
    events: events,
    totalCount: result.total_count,
  };
}

/**
 * Fetches only updated events (based on cached IDs and updated_at timestamp).
 * This function is also responsible for caching its own results.
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
  await eventCache.cacheEventDetails(events); // Cache the updated details

  // Asynchronously prefetch images for the fetched events.
  prefetchImages(events.map((e: Event) => e.imageUrl)).catch((err: any) => {
    console.warn("[ImageCache] Background prefetch failed for sync:", err);
  });
  return events;
}

async function getLatestEventTimestamp(): Promise<string | null> {
  const { data, error } = await withRetry(() =>
    supabase.rpc("get_latest_event_timestamp").single()
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
  const cachedEventIds = await eventCache.getCachedEventListIds();

  if (cachedEventIds.length > 0 && useNetworkStatus.getState().isConnected) {
    console.log(
      `[Initial Load] Found ${cachedEventIds.length} event IDs in list cache. Hydrating...`
    );
    const cachedEvents = await eventCache.hydrateEventsFromCache(
      cachedEventIds
    );
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
    console.log(
      `[Initial Load] Prefetching ${firstPageEvents.length} new images...`
    );
    try {
      await prefetchImages(firstPageEvents.map((e: Event) => e.imageUrl));
      console.log("[Initial Load] Image prefetch complete.");
    } catch (err: any) {
      console.warn(
        "[Initial Load] Image prefetch failed, but proceeding:",
        err
      );
    }
  }
  // Cache the new list of IDs
  await eventCache.cacheEventListIds(firstPageEvents.map((e) => e.id));

  return { events: firstPageEvents, total: totalCount };
}

/**
 * Fetches events from the server for an ephemeral search.
 * This function DOES NOT cache results or prefetch images.
 */
async function fetchNetworkSearch(params: {
  page?: number | null;
  limit?: number | null;
  query?: string;
  category?: string;
}): Promise<{ events: Event[]; totalCount: number }> {
  const formattedQuery = formatQueryForTsquery(params.query ?? ""); // APPLY FORMATTING
  const { data, error } = await withRetry(() =>
    supabase.rpc("get_paginated_events", {
      p_page: params.page ?? null,
      p_limit: params.limit ?? null,
      p_query: formattedQuery, // FORMATTED QUERY
      p_category: params.category ?? "All",
      p_last_updated: null, // ignore sync time for a live search
    })
  );

  if (error) throw error;

  const result = data[0] || { events: [], total_count: 0 };
  const events: Event[] = (result.events || []).map(eventMapper);

  // Note: We deliberately DO NOT cache details or prefetch images here.
  return {
    events: events,
    totalCount: result.total_count,
  };
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
    await eventCache.cacheEventListIds(updatedFullCache.map((e) => e.id));
    return { events: updatedFullCache, total: totalCount };
  } else {
    // When reached the end of pagination.
    // Instead of a full sync, just check for *new* items (Page 1)
    // and *append* them to the bottom for a smooth UX.
    console.log(
      "[Load More] Reached end of pagination. Checking for new events..."
    );

    const localTimestamp = await getLastSyncTimestamp();
    const { events: brandNewEvents, totalCount: newTotalCount } =
      await fetchEvents({
        lastSyncTimestamp: localTimestamp || "2025-01-01T00:00:00Z",
        query: filters.query,
        category: filters.category,
        page: 1,
        limit: EVENTS_PER_PAGE,
      });

    if (brandNewEvents.length > 0) {
      console.log(
        `[Load More] Found ${brandNewEvents.length} new events at the top.`
      );

      // Prefetch their images
      try {
        await prefetchImages(brandNewEvents.map((e: Event) => e.imageUrl));
      } catch (err: any) {
        console.warn("[Load More] Image prefetch failed for new events:", err);
      }

      // Merge them (appends them to the end)
      const updatedFullCache = mergeAndDedupeEvents(
        currentFullCache,
        brandNewEvents
      );
      // Save this temporarily "unsorted" list. It will be
      // fixed by the sync on the next app open.
      await eventCache.cacheEventListIds(updatedFullCache.map((e) => e.id));
      await storageService.setItem(
        storageKeys.getEventsTotalCountKey(),
        newTotalCount
      );

      return { events: updatedFullCache, total: newTotalCount };
    } else {
      // No new events found anywhere
      console.log("[Load More] No new events found. List is exhausted.");
      return { events: currentFullCache, total: totalCount };
    }
  }
}

/**
 * Fetches a single event by ID.
 * Tries detail cache first, then falls back to network.
 */
async function fetchEventById(id: number): Promise<Event | null> {
  const detailCache = await eventCache.getDetailCache();
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
  await eventCache.cacheEventDetails([event]); // Caches the new event
  // Asynchronously prefetch images for the fetched events.
  prefetchImages([event.imageUrl]).catch((err: any) => {
    console.warn(
      "[ImageCache] Background prefetch failed for fetchEventById:",
      err
    );
  });
  return event;
}

/**
 * Fetches a list of events by their IDs.
 * Tries detail cache first, then falls back to network for missing ones.
 */
async function fetchEventsByIds(ids: number[]): Promise<Event[]> {
  if (ids.length === 0) return [];

  const detailCache = await eventCache.getDetailCache();

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
      await eventCache.cacheEventDetails(fetchedEvents); // Caches new events
      // Asynchronously prefetch images for the fetched events.
      prefetchImages(fetchedEvents.map((e: Event) => e.imageUrl)).catch(
        (err: any) => {
          console.warn(
            "[ImageCache] Background prefetch failed for fetchEventsByIds:",
            err
          );
        }
      );
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
  currentFullCache: Event[],
  filters: { query: string; category: string }
): Promise<Event[] | null> {
  if (!useNetworkStatus.getState().isConnected) {
    throw new Error("Offline. Cannot sync.");
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

  // SYNC LOGIC

  // Check for updates to events *already in the cache*.
  const cachedIds = currentFullCache.map((e) => e.id);
  const updatedEvents = await fetchUpdatedCachedEvents(
    cachedIds,
    localTimestamp || "2025-01-01T00:00:00Z"
  );

  // Check for *new* events (Page 1 only).
  const { events: newEvents, totalCount } = await fetchEvents({
    lastSyncTimestamp: localTimestamp || "2025-01-01T00:00:00Z",
    query: filters.query,
    category: filters.category,
    page: 1,
    limit: EVENTS_PER_PAGE,
  });

  // Update total count in storage
  await storageService.setItem(
    storageKeys.getEventsTotalCountKey(),
    totalCount
  );

  // Merge results if we found anything
  if (updatedEvents.length > 0 || newEvents.length > 0) {
    console.log(
      `[Sync] Found ${updatedEvents.length} updated events and ${newEvents.length} new events.`
    );

    // Prefetch images for *new* events (updated ones were prefetched already)
    try {
      await prefetchImages(newEvents.map((e: Event) => e.imageUrl));
    } catch (err: any) {
      console.warn("[Sync] Image prefetch failed for new events:", err);
    }

    // Merge new data into our full cache
    const combinedChanges = [...updatedEvents, ...newEvents];
    let mergedEvents = mergeAndDedupeEvents(currentFullCache, combinedChanges);

    // Re-sort the entire cache to ensure new events are at the top
    mergedEvents.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    await eventCache.cacheEventListIds(mergedEvents.map((e) => e.id));

    if (serverTimestamp) {
      await setLastSyncTimestamp(serverTimestamp);
    }
    return mergedEvents;
  } else {
    console.log("[Sync] No new or updated events found.");
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
  await eventCache.clearCachedEvents();
  return getInitialEvents(filters);
}

export const eventService = {
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  fetchEvents,
  fetchUpdatedCachedEvents,
  getLatestEventTimestamp,
  getInitialEvents,
  getMoreEvents,
  fetchEventById,
  fetchEventsByIds,
  syncEventCache,
  refreshEventCache,
  fetchNetworkSearch
};
