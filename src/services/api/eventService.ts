import { supabase } from "../../lib/supabase";
import { Event } from "../../types/event";
import { eventMapper } from "../../utils/mappers/eventMapper";
import * as sqliteService from "../sqliteService";
import { useNetworkStatus } from "../../stores/network-store";

const EVENTS_PER_PAGE = 5;

/**
 * Fetches events for the infinite query.
 * Implements "Stale-While-Revalidate" (via queryFn).
 * The cache is seeded by useEventCacheHydration.
 */
export async function fetchEvents({
  pageParam = 1,
  query,
  category,
}: {
  pageParam: number;
  query: string;
  category: string;
}) {
  const isConnected = useNetworkStatus.getState().isConnected;

  if (!isConnected) {
    // If offline, dont fetch. React Query will use the
    // (already hydrated) cache data and not even call this.
    throw new Error("Offline. Cannot fetch new events.");
  }

  // If Online, Fetch from Server
  console.log(`[eventService] Fetching page ${pageParam} from network...`);
  const { data, error } = await supabase.rpc("get_paginated_events", {
    p_page: pageParam,
    p_limit: EVENTS_PER_PAGE,
    p_query: query,
    p_category: category,
    p_last_updated: null,
  });

  if (error) throw error;

  const result = data[0] || { events: [], total_count: 0 };
  const events: Event[] = (result.events || []).map(eventMapper);

  // Insert to SQLite database
  if (pageParam === 1) {
    // If it's the first page, we replace the old events
    await sqliteService.saveEvents(events);
  } else {
    // If it's a new page, we add to the existing events
    const oldEvents = await sqliteService.getEvents();
    await sqliteService.saveEvents([...oldEvents, ...events]);
  }

  return {
    events,
    totalCount: result.total_count,
    nextPage: events.length < EVENTS_PER_PAGE ? undefined : pageParam + 1,
  };
}

/**
 * Fetches a batch of events by their IDs.
 * Handles Offline Fallback & Caching
 */
export async function fetchEventsByIds(eventIds: number[]): Promise<Event[]> {
  if (eventIds.length === 0) return [];

  const isConnected = useNetworkStatus.getState().isConnected;

  // Online: Fetch, Map, SAVE to SQLite, Return
  if (isConnected) {
    try {
      console.log(
        `[eventService] Online. Fetching ${eventIds.length} events...`
      );
      const { data, error } = await supabase.rpc("get_events_by_ids", {
        event_ids: eventIds,
      });
      if (error) throw error;

      if (!data) return [];

      const events = data.map(eventMapper);

      // Save the details to SQLite so they exist offline
      if (events.length > 0) {
        console.log(
          `[eventService] Caching ${events.length} fetched events to SQLite...`
        );
        await sqliteService.saveEvents(events);
      }

      return events;
    } catch (error) {
      console.warn(
        "[eventService] Network request failed. Falling back to cache.",
        error
      );
      // Fall through to cache logic below
    }
  } else {
    console.log(`[eventService] Offline. Skipping network fetch.`);
  }

  // Offline (or Network Error): Read from SQLite
  console.log(
    `[eventService] Fetching ${eventIds.length} events from SQLite cache...`
  );
  const cachedEvents = await sqliteService.getEventsByIds(eventIds);
  console.log(`[eventService] Found ${cachedEvents.length} events in cache.`);

  return cachedEvents;
}

/**
 * [NETWORK ONLY] Fetches a single event by its ID.
 * This is for the EventDetailsScreen.
 */
async function fetchEventByIdFromNetwork(eventId: number): Promise<Event> {
  // This queryFn is now just for fetching fresh data.
  const { data, error } = await supabase.rpc("get_events_by_ids", {
    event_ids: [eventId],
  });
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Event not found");
  }
  const event = eventMapper(data[0]);

  // Insert to SQLite database IMMEDIATELY
  await sqliteService.saveEvents([event]); // Upsert this event
  console.log(`[eventService] Updated SQLite cache for event ${eventId}`);

  return event;
}

/**
 * [CACHE] Gets a single event by ID.
 * Fetches from the network if online, otherwise falls back to SQLite cache.
 */
export async function fetchEventById(eventId: number): Promise<Event> {
  const isConnected = useNetworkStatus.getState().isConnected;

  if (isConnected) {
    console.log(
      `[eventService] Online. Fetching event ${eventId} from network...`
    );
    // If online, get from network (which also saves to SQLite)
    return await fetchEventByIdFromNetwork(eventId);
  }

  // If offline, attempt to get from cache
  console.log(
    `[eventService] Offline. Fetching event ${eventId} from cache...`
  );
  const cachedEvent = await sqliteService.getEventById(eventId);

  if (cachedEvent) {
    return cachedEvent;
  }

  // If offline AND not in cache, we must throw an error
  throw new Error("You are offline and this event has not been cached.");
}
