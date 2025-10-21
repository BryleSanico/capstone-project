import { fetchPendingReminders, updateReminderStatus } from "./db.ts";
import { sendNotifications } from "./fcm.ts";

console.log("Reminder Push Function starting...");

async function processReminders(
  reminderType: "1 hour" | "24 hours",
) {
  console.log(`Processing ${reminderType} reminders...`);

  // 1. Fetch all reminders due for this interval
  // Removed the 'client' argument, as fetchPendingReminders uses its own admin client
  const pendingReminders = await fetchPendingReminders(reminderType);
  if (pendingReminders.length === 0) {
    console.log(`No pending ${reminderType} reminders found.`);
    return;
  }
  console.log(
    `Found ${pendingReminders.length} pending ${reminderType} reminders.`,
  );

  // 2. Send notifications via FCM
  const successfulTicketIds = await sendNotifications(
    pendingReminders,
    reminderType,
  );
  if (successfulTicketIds.length === 0) {
    console.log(`No ${reminderType} notifications were sent successfully.`);
    return;
  }
  console.log(
    `Successfully sent ${successfulTicketIds.length} notifications for ${reminderType} reminders.`,
  );

  // 3. Update the database to mark reminders as sent
  // Removed the 'client' argument, as updateReminderStatus uses its own admin client
  await updateReminderStatus(reminderType, successfulTicketIds);
}

Deno.serve(async (_req) => {
  try {
    // Removed the Supabase client creation here.
    // The functions in 'db.ts' correctly create and use their own
    // 'supabaseAdmin' client with the service role key, which is the
    // correct pattern for Supabase Edge Functions.

    // Process both reminder types sequentially
    await processReminders("24 hours");
    await processReminders("1 hour");

    return new Response(
      JSON.stringify({ message: "Reminder processing complete." }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Critical error in reminder function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/reminder-push' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
