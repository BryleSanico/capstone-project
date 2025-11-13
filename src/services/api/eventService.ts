import { supabase } from '../../lib/supabase';
import { Event } from '../../types/event';
import { eventMapper } from '../../utils/mappers/eventMapper';
import storageService from '../../services/storageService';
import { storageKeys } from '../../utils/cache/storageKeys';

const EVENTS_PER_PAGE = 5;

/**
 * Fetches a single page of events.
 * This will be called by useInfiniteQuery.
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
  console.log(`[eventService] Fetching page ${pageParam}...`);
  const { data, error } = await supabase.rpc('get_paginated_events', {
    p_page: pageParam,
    p_limit: EVENTS_PER_PAGE,
    p_query: query, 
    p_category: category,
    p_last_updated: null,
  });

  if (error) throw error;

  const result = data[0] || { events: [], total_count: 0 };
  const events: Event[] = (result.events || []).map(eventMapper);
  const totalCount = result.total_count;

  return {
    events,
    totalCount,
    nextPage: events.length < EVENTS_PER_PAGE ? undefined : pageParam + 1,
  };
}

/**
 * Fetches a batch of events by their IDs.
 */
export async function fetchEventsByIds(eventIds: number[]): Promise<Event[]> {
  if (eventIds.length === 0) return [];
  
  const { data, error } = await supabase.rpc('get_events_by_ids', {
    event_ids: eventIds,
  });
  if (error) throw error;
  if (!data) return [];
  return data.map(eventMapper);
}

/**
 * Fetches a single event by its ID.
 * This is for the EventDetailsScreen.
 */
export async function fetchEventById(eventId: number): Promise<Event> {
  const { data, error } = await supabase.rpc('get_events_by_ids', {
    event_ids: [eventId],
  });
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Event not found');
  }
  return eventMapper(data[0]);
}

/**
 * Performs a full delta-sync of the event cache.
 * This is the new, efficient sync logic.
 */
export async function syncEvents(
  cachedEventIds: number[],
  filters: { query: string; category: string },
) {
  const lastSyncTimestamp = await storageService.getItem<string>(
    storageKeys.getEventsSyncKey(),
  );

  // Get updates and deletions for cached items
  const { data: syncData, error: syncError } = await supabase.rpc(
    'get_sync_data_for_cached_events',
    {
      p_event_ids: cachedEventIds,
      p_last_updated: lastSyncTimestamp || '2000-01-01T00:00:00Z',
    },
  );
  if (syncError) throw syncError;

  const { updated_events, existing_ids } = syncData[0];
  const updatedEvents: Event[] = (updated_events || []).map(eventMapper);
  const existingIdsSet = new Set<number>(existing_ids || []);
  const deletedEventIds = cachedEventIds.filter((id) => !existingIdsSet.has(id));

  // Get new (Page 1) items
  const { data: newData, error: newError } = await supabase.rpc(
    'get_paginated_events',
    {
      p_page: 1,
      p_limit: EVENTS_PER_PAGE,
      p_query: filters.query,
      p_category: filters.category,
      p_last_updated: lastSyncTimestamp || '2000-01-01T00:00:00Z',
    },
  );
  if (newError) throw newError;
  const newEvents: Event[] = (newData[0]?.events || []).map(eventMapper);

  // Get the *true* total count
  const { data: totalCount, error: countError } = await supabase.rpc(
    'get_total_event_count',
    {
      p_query: filters.query,
      p_category: filters.category,
    },
  );
  if (countError) throw countError;

  // Set the new sync timestamp
  await storageService.setItem(
    storageKeys.getEventsSyncKey(),
    new Date().toISOString(),
  );

  return {
    updatedEvents,
    deletedEventIds,
    newEvents,
    totalCount: (totalCount as number) ?? 0,
  };
}