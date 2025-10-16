import { Event } from '../types/event';

/**
 * Performs a local, case-insensitive search on an array of events.
 * @param events The array of events to search through.
 * @param query The search query string.
 * @returns A new array of events that match the query.
 */
export const searchCache = (events: Event[], query: string): Event[] => {
  // If the query is empty, return all events without filtering.
  if (!query.trim()) {
    return events;
  }

  const lowercasedQuery = query.toLowerCase();
  // Tokenize the search query to match individual words.
  const tokens = lowercasedQuery.split(' ').filter(t => t.length > 0);

  return events.filter(event => {
    // Create a single searchable string from the event's relevant fields.
    const searchableText = [
      event.title,
      event.description,
      event.location,
      event.category,
      ...(event.tags || [])
    ].join(' ').toLowerCase();

    // Ensure every token from the search query exists in the event's searchable text.
    return tokens.every(token => searchableText.includes(token));
  });
};
