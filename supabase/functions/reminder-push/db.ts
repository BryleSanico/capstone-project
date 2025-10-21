import { createClient } from "@supabase/supabase-js";
import { PendingReminder } from "./types.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Fetches all tickets that are due for a reminder.
 * @param type - The type of reminder ('1 hour' or '24 hours').
 */
export async function fetchPendingReminders(
  type: "1 hour" | "24 hours",
): Promise<PendingReminder[]> {
  const now = new Date();
  const flagColumn = type === "1 hour"
    ? "is_1h_reminder_sent"
    : "is_24h_reminder_sent";

  const upperTime = new Date(
    now.getTime() + (type === "1 hour" ? 60 : 24 * 60) * 60 * 1000,
  );
  const lowerTime = new Date(upperTime.getTime() - 15 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id,
      events (title, start_time),
      profiles (fcm_token)
    `,
    )
    .eq(flagColumn, false)
    .not("profiles.fcm_token", "is", null)
    .lt("events.start_time", upperTime.toISOString())
    .gt("events.start_time", lowerTime.toISOString());

  if (error) {
    console.error(`Error fetching pending ${type} reminders:`, error);
    return [];
  }

  // Filter out rows missing related data
  const validReminders = data.filter((item: any) => {
    if (!item.events || !item.profiles || !item.profiles.fcm_token) {
      console.warn(
        `[${type} reminder] Skipping ticket ${item.id} — Missing event or profile relationship.`,
      );
      return false;
    }
    return true;
  });

  // Map valid rows
  return validReminders.map((item: any) => ({
    ticket_id: item.id,
    event_title: item.events.title ?? "Untitled Event",
    fcm_token: item.profiles.fcm_token,
  }));
}

/**
 * Updates the reminder flags for a list of successfully sent ticket IDs.
 */
export async function updateReminderStatus(
  type: "1 hour" | "24 hours",
  ticketIds: number[],
): Promise<void> {
  if (ticketIds.length === 0) return;

  const flagColumn = type === "1 hour"
    ? "is_1h_reminder_sent"
    : "is_24h_reminder_sent";

  const { error } = await supabaseAdmin
    .from("tickets")
    .update({ [flagColumn]: true })
    .in("id", ticketIds);

  if (error) {
    console.error(`Error updating ${type} reminder status:`, error);
  } else {
    console.log(
      `✅ Successfully updated ${type} reminder status for ${ticketIds.length} tickets.`,
    );
  }
}
