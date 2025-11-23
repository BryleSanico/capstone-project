// src/types/navigation.ts
import { Ticket } from './ticket';
import { Event } from './event';

/**
 * Defines the keys for our standard "Upcoming/Past" tabs.
 * Using this makes our components more robust and avoids typos.
 */
export const TAB_KEYS = {
  UPCOMING: 'upcoming',
  PAST: 'past',
  PENDING: 'pending',
} as const;

export type TabKey = (typeof TAB_KEYS)[keyof typeof TAB_KEYS];

/**
 * Defines the display configuration for each tab key.
 * This centralizes the logic and avoids string literals in components.
 */
export const TAB_CONFIG = {
  [TAB_KEYS.UPCOMING]: {
    title: 'Upcoming',
  },
  [TAB_KEYS.PAST]: {
    title: 'Past',
  },
  [TAB_KEYS.PENDING]: {
    title: 'Pending',
  },
};

/**
 * A type for the reusable TabSelector component.
 */
export type TabItem = {
  key: TabKey;
  title: string;
  count: number;
};

// --- Helper types for memoized filtering ---

/**
 * A helper type to hold a Ticket and its pre-calculated timestamp
 * to avoid reparsing the date multiple times.
 */
export type TicketWithTimestamp = {
  ticket: Ticket;
  timestamp: number;
};

/**
 * A helper type to hold an Event and its pre-calculated timestamp.
 */
export type EventWithTimestamp = {
  event: Event;
  timestamp: number;
};