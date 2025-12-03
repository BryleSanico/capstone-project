import { Event } from "../../types/event";
import { Ticket } from "../../types/ticket";
import {
  EventWithTimestamp,
  TicketWithTimestamp,
} from "../../types/TabSegment";

/**
 * A reusable, optimized function to filter and sort data into
 * upcoming and past categories based on a pre-calculated timestamp.
 */
function getFilteredLists<T, U extends { timestamp: number }>(
  itemsWithTimestamp: U[],
  now: number,
  getItem: (item: U) => T
): { upcoming: T[]; past: T[] } {
  const upcoming: U[] = [];
  const past: U[] = [];

  // Filter the pre-calculated list
  for (const item of itemsWithTimestamp) {
    if (item.timestamp >= now) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  }

  // Sort using the pre-calculated timestamp (much faster)
  upcoming.sort((a, b) => a.timestamp - b.timestamp); // ascending
  past.sort((a, b) => b.timestamp - a.timestamp); // descending

  // Return the original data type
  return {
    upcoming: upcoming.map(getItem),
    past: past.map(getItem),
  };
}

/**
 * Filters a list of Events into upcoming, past, and pending.
 * Pending events are those where isApproved is false.
 * @param events The raw array of events.
 * @param now A timestamp (e.g., new Date().getTime())
 * @returns An object with { upcoming, past, pending } arrays.
 */
export function filterEventsByDate(
  events: Event[],
  now: number
): { upcoming: Event[]; past: Event[]; pending: Event[] } {
  const upcomingWithTs: EventWithTimestamp[] = [];
  const pastWithTs: EventWithTimestamp[] = [];
  const pendingWithTs: EventWithTimestamp[] = [];

  events.forEach((event) => {
    let timestamp = 0;
    try {
      timestamp = new Date(event.startTime).getTime();
    } catch (e) {
      console.error(
        `Invalid date for event ${event.id}: ${event.startTime}`,
        e
      );
    }

    const item = { event, timestamp };

    if (event.isApproved === false) {
      pendingWithTs.push(item);
    } else if (timestamp >= now) {
      upcomingWithTs.push(item);
    } else {
      pastWithTs.push(item);
    }
  });

  // Sort lists
  upcomingWithTs.sort((a, b) => a.timestamp - b.timestamp); // Ascending (soonest first)
  pastWithTs.sort((a, b) => b.timestamp - a.timestamp); // Descending (most recent first)
  pendingWithTs.sort((a, b) => b.timestamp - a.timestamp); // Descending (newest submission first)

  return {
    upcoming: upcomingWithTs.map((i) => i.event),
    past: pastWithTs.map((i) => i.event),
    pending: pendingWithTs.map((i) => i.event),
  };
}

/**
 * Filters a list of Tickets into upcoming and past.
 * @param tickets The raw array of tickets.
 * @param now A timestamp (e.g., new Date().getTime())
 * @returns An object with { upcoming, past } arrays.
 */
export function filterTicketsByDate(
  tickets: Ticket[],
  now: number
): { upcoming: Ticket[]; past: Ticket[] } {
  // Map ONCE to create a list with pre-calculated timestamps
  const ticketsWithTimestamp: TicketWithTimestamp[] = tickets.map((ticket) => {
    let timestamp = 0;
    try {
      timestamp = new Date(ticket.eventDate).getTime();

      if (isNaN(timestamp)) {
        // Fallback in case eventDate is NOT a valid string, to prevent crash
        console.warn(
          `Invalid date string for ticket ${ticket.id}: ${ticket.eventDate}`
        );
        timestamp = 0;
      }
    } catch (e) {
      console.error(
        `Error parsing date for ticket ${ticket.id}: ${ticket.eventDate}`,
        e
      );
    }
    return { ticket, timestamp };
  });

  return getFilteredLists(ticketsWithTimestamp, now, (item) => item.ticket);
}
