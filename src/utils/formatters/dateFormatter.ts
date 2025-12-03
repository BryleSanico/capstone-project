/**
 * A centralized utility for handling date and time formatting consistently across the app.
 * These pure functions are easily testable.
 * @param dateString - An ISO 8601 date string.
 */

// A helper to safely create a Date object from a string.
const toDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  // Check if the date is valid to prevent crashes from invalid data
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a date string into a long, readable format for detail screens.
 * @example "Sunday, October 19, 2025"
 */
export const formatFullDate = (dateString: string): string => {
  const date = toDate(dateString);
  if (!date) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Formats a date string into a standard time format with AM/PM.
 * @example "2:05 PM"
 */
export const formatTime = (dateString: string): string => {
  const date = toDate(dateString);
  if (!date) return ""; // Return empty string for invalid time
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Formats a date string for use in compact event cards (Month Day).
 * @example "Oct 19"
 */
export const formatDateMMDD = (dateString: string): string => {
  const date = toDate(dateString);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a date string for use in ticket cards (Month Day, Year).
 * @example "Oct 19, 2025"
 */
export const formatDateMMDDYY = (dateString: string): string => {
  const date = toDate(dateString);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
