import { formatDistanceToNow, isBefore, subDays } from "date-fns";

/**
 * Formats a date string to a relative time string (e.g., "5 minutes ago").
 * If the date is older than 24 days, it returns the full date.
 * @param dateString ISO date string
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const twentyFourDaysAgo = subDays(now, 24);

  if (isBefore(date, twentyFourDaysAgo)) {
    // Return full date for items older than 24 days
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Return relative time
  return formatDistanceToNow(date, { addSuffix: true });
};
