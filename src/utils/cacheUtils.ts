import { Event } from '../types/event';

/**
 * Merges a new array of events into an existing cache. It updates existing
 * events, adds new ones, and ensures the final array is sorted by start time descending
 * without any duplicates.
 * @param existingEvents The current array of events in the cache.
 * @param newEvents The new array of events to merge in.
 * @returns A new, merged, sorted, and deduplicated array of events.
 */
export function mergeAndDedupeEvents(existingEvents: Event[], newEvents: Event[]): Event[] {
  // Use a Map to handle deduplication and updates efficiently.
  // The key is the event ID.
  const eventsMap = new Map(existingEvents.map(event => [event.id, event]));

  // Add new events to the map, overwriting any existing ones with the same ID.
  newEvents.forEach(event => {
    eventsMap.set(event.id, event);
  });

  // Convert the map back to an array and sort it.
  const mergedEvents = Array.from(eventsMap.values());

  // Sort by start time, with the most recent events first.
  mergedEvents.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return mergedEvents;
}
