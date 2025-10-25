import { supabase } from "../lib/supabase";
import { Event } from "../types/event";
import storageService from "./storageService";
import { useNetworkStatus } from "../stores/network-store";
import { storageKeys } from "../utils/storageKeys";
import { eventMapper } from "../utils/mappers/eventMapper";

// Helper to get the detailed event cache.
const getDetailCache = async (): Promise<Record<number, Event>> => {
  return (
    (await storageService.getItem<Record<number, Event>>(
      storageKeys.getEventsDetailCacheKey()
    )) || {}
  );
};

// Helper to save an event (or multiple events) to the detailed cache.
const cacheEventDetails = async (events: Event[]) => {
  if (events.length === 0) return;
  const cache = await getDetailCache();
  events.forEach((event) => {
    cache[event.id] = event;
  });
  await storageService.setItem(storageKeys.getEventsDetailCacheKey(), cache);
};

export const eventService = {
  // Caching for DiscoverScreen list
  getCachedEvents: async (): Promise<Event[]> =>
    (await storageService.getItem<Event[]>(storageKeys.getEventsCacheKey())) ||
    [],
  cacheEvents: (events: Event[]) =>
    storageService.setItem(storageKeys.getEventsCacheKey(), events),
  clearCachedEvents: () =>
    storageService.removeItem(storageKeys.getEventsCacheKey()),
  clearCachedEventDetails: () =>
    storageService.removeItem(storageKeys.getEventsDetailCacheKey()),
  getLastSyncTimestamp: () =>
    storageService.getItem<string>(storageKeys.getEventsSyncKey()),
  setLastSyncTimestamp: (ts: string) =>
    storageService.setItem(storageKeys.getEventsSyncKey(), ts),
  cacheEventDetails,
  getDetailCache,

  /**
   * Fetches events from the server. Can be paginated or can fetch all/all updates.
   * @param page - Page number for pagination. Pass null to fetch all.
   * @param limit - Number of items per page. Pass null to fetch all.
   * @param query - Search query string.
   * @param category - Category filter string.
   * @param lastSyncTimestamp - Timestamp for fetching delta updates. Pass null for full fetch.
   */
  async fetchEvents(
    page: number | null,
    limit: number | null,
    query: string,
    category: string,
    lastSyncTimestamp: string | null
  ): Promise<{ events: Event[]; totalCount: number }> {
    const { data, error } = await supabase.rpc("get_paginated_events", {
      p_page: page,
      p_limit: limit,
      p_query: query,
      p_category: category,
      p_last_updated: lastSyncTimestamp,
    });

    if (error) throw error;

    const result = data[0] || { events: [], total_count: 0 };
    const events = (result.events || []).map(eventMapper);

    await cacheEventDetails(events);

    return {
      events: events,
      totalCount: result.total_count,
    };
  },

  async getLatestEventTimestamp(): Promise<string | null> {
    const { data, error } = await supabase
      .rpc("get_latest_event_timestamp")
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as string | null;
  },

  async fetchEventById(id: number): Promise<Event | null> {
    const detailCache = await getDetailCache();
    if (detailCache[id]) {
      return detailCache[id];
    }

    if (!useNetworkStatus.getState().isConnected) {
      return null;
    }

    const { data, error } = await supabase.rpc("get_events_by_ids", {
      event_ids: [id],
    });
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const event = eventMapper(data[0]);
    await cacheEventDetails([event]);
    return event;
  },

  async fetchEventsByIds(ids: number[]): Promise<Event[]> {
    if (ids.length === 0) return [];
    const detailCache = await getDetailCache();
    const cachedEvents = ids
      .map((id) => detailCache[id])
      .filter(Boolean) as Event[];
    const cachedIds = new Set(cachedEvents.map((e) => e.id));
    const idsToFetch = ids.filter((id) => !cachedIds.has(id));

    if (idsToFetch.length === 0) return cachedEvents;

    if (useNetworkStatus.getState().isConnected) {
      try {
        const { data, error } = await supabase.rpc("get_events_by_ids", {
          event_ids: idsToFetch,
        });
        if (error) throw error;
        const fetchedEvents = data.map(eventMapper);
        await cacheEventDetails(fetchedEvents);
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
  },

  /**
   * Fetch only updated events (based on cached IDs and updated_at timestamp)
   */
  async fetchUpdatedCachedEvents(
    cachedIds: number[],
    lastSyncTimestamp: string
  ): Promise<Event[]> {
    if (cachedIds.length === 0) return [];

    const { data, error } = await supabase.rpc("get_updated_cached_events", {
      p_event_ids: cachedIds,
      p_last_updated: lastSyncTimestamp,
    });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const events = data.map(eventMapper);
    await cacheEventDetails(events);
    return events;
  },
};
