import { Event } from '../../types/event';
import storageService from '../storageService';
import { storageKeys } from '../../utils/cache/storageKeys';

/**
 * Gets the detailed event cache (normalized).
 * @returns A record map of eventId -> Event.
 */
export async function getDetailCache(): Promise<Record<number, Event>> {
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
export async function cacheEventDetails(events: Event[]) {
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
export async function getCachedEventListIds(): Promise<number[]> {
  return (
    (await storageService.getItem<number[]>(storageKeys.getEventsCacheKey())) ||
    []
  );
}

/**
 * Saves the ordered list of event IDs for the Discover screen.
 * @param ids An array of event IDs.
 */
export async function cacheEventListIds(ids: number[]) {
  return storageService.setItem(storageKeys.getEventsCacheKey(), ids);
}

/**
 * Hydrates full event objects from a list of IDs using the detail cache.
 * @param ids An array of event IDs.
 * @returns An array of full Event objects.
 */
export async function hydrateEventsFromCache(ids: number[]): Promise<Event[]> {
  const detailCache = await getDetailCache();
  // Filter out any IDs that might not be in the cache (though they should be)
  return ids.map((id) => detailCache[id]).filter(Boolean) as Event[];
}

/**
 * Clears the cached list of event IDs.
 */
export async function clearCachedEvents() {
  return storageService.removeItem(storageKeys.getEventsCacheKey());
}

/**
 * Clears the normalized event detail cache.
 */
export async function clearCachedEventDetails() {
  return storageService.removeItem(storageKeys.getEventsDetailCacheKey());
}
