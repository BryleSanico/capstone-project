/**
 * A centralized utility for handling data transformations related to event objects.
 * These pure functions are easily testable and separated from the service layer.
 */

/**
 * Helper to combine date and time into ISO string
 * @param date YYYY-MM-DD
 * @param time HH:MM
 */
export function combineDateTime(date: string, time: string): string { // Return string or throw
  console.log('[combineDateTime] Input:', { date, time });
  if (!date || !time) {
     console.error("[combineDateTime] Date or Time is missing.");
     throw new Error("Date and Time are required.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    console.error("[combineDateTime] Invalid date or time format received:", date, time);
    throw new Error("Invalid Date (YYYY-MM-DD) or Time (HH:MM) format.");
  }
  try {
    // Note: This creates a date in the local timezone.
    // If you need UTC, use `${date}T${time}:00Z`
    const isoString = `${date}T${time}:00`;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      throw new Error("Invalid date/time combination resulted in NaN.");
    }
     console.log('[combineDateTime] Output ISO:', d.toISOString());
    return d.toISOString();
  } catch (e: any) {
    console.error("[combineDateTime] Error creating ISO string:", e.message);
    throw new Error(`Failed to process date/time: ${e.message}`);
  }
}

/**
 * Helper to parse a comma-separated string into an array of tags.
 * @param tagsString "tag1, tag2, tag3"
 */
export function parseTags(tagsString: string): string[] {
  if (!tagsString) return [];
  return tagsString.split(',')
    .map(tag => tag.trim()) // Remove whitespace
    .filter(Boolean); // Remove any empty strings (e.g., from "tag1,,tag2")
}
