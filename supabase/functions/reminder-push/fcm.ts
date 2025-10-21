import { App, cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { PendingReminder } from "./types.ts";

// A flag to ensure we only initialize the Firebase app once.
let firebaseApp: App | null = null;

/**
 * Initializes the Firebase Admin SDK.
 * It ensures initialization only happens once per function invocation.
 */
function initializeFirebase() {
  if (firebaseApp) {
    return;
  }

  try {
    const serviceAccount = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_KEY")!);
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unknown initialization error";
    console.error("Error initializing Firebase Admin SDK:", message);
    throw new Error(
      "Could not initialize Firebase Admin. Check FCM_SERVICE_ACCOUNT_KEY environment variable.",
    );
  }
}

/**
 * Sends push notifications for a list of pending reminders.
 * * @param reminders - An array of reminders to be processed.
 * @param reminderType - The type of reminder ('1 hour' or '24 hours').
 * @returns An array of ticket IDs for which notifications were successfully sent.
 */
export async function sendNotifications(
  reminders: PendingReminder[],
  reminderType: "1 hour" | "24 hours",
): Promise<number[]> {
  if (reminders.length === 0) {
    return [];
  }

  initializeFirebase();

  const messaging = getMessaging(firebaseApp!);
  const successfulTicketIds: number[] = [];

  const notificationPromises = reminders.map(async (reminder) => {
    const message = {
      notification: {
        title: `Reminder: ${reminder.event_title}`,
        body: `Your event starts in ${reminderType}!`,
      },
      token: reminder.fcm_token,
    };

    try {
      await messaging.send(message);
      // FIX: Return the ticket_id (number) directly on success.
      // Promise.allSettled will wrap this in: { status: 'fulfilled', value: reminder.ticket_id }
      return reminder.ticket_id;
    } catch (error) {
      let errorMessage = "Unknown error";
      let errorCode: string | null = null;

      if (typeof error === "object" && error !== null) {
        if ("message" in error) {
          errorMessage = String((error as { message: unknown }).message);
        }
        if ("code" in error) {
          errorCode = String((error as { code: unknown }).code);
        }
      }

      console.error(
        `Failed to send notification for ticket ${reminder.ticket_id}:`,
        errorMessage,
      );
      if (errorCode === "messaging/registration-token-not-registered") {
        // TODO: Add logic here to nullify the fcm_token in the database.
      }

      // FIX: Throw an error so Promise.allSettled catches it as 'rejected'.
      // This ensures this promise settlement is { status: 'rejected', reason: ... }
      throw new Error(errorMessage);
    }
  });

  // Use Promise.allSettled to continue even if some notifications fail.
  const results = await Promise.allSettled(notificationPromises);

  results.forEach((result) => {
    // FIX: This logic is now correct.
    // If fulfilled, result.value is the 'number' (ticket_id) we returned.
    if (result.status === "fulfilled" && result.value) {
      successfulTicketIds.push(result.value);
    }
    // If 'rejected', we don't need to do anything here since we logged the error above.
  });

  return successfulTicketIds;
}
