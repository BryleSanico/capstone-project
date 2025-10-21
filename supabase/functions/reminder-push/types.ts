/**
 * Represents a pending reminder to be sent.
 * This is a flattened structure combining data from tickets, events, and profiles.
 */
export interface PendingReminder {
  ticket_id: number;
  event_title: string;
  fcm_token: string;
}
