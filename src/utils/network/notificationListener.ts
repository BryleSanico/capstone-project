import { getMessaging, onMessage, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { DEFAULT_NOTIFICATION_CHANNEL } from "../../constants/firebaseConstants";
/**
 * Utility: Safely convert any value into string for display
 */
const toSafeString = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return fallback;
};

/**
 * Handles foreground notification display
 */
const handleForegroundMessage = async (remoteMessage: any) => {
  console.log("📬 Foreground message:", remoteMessage);

  const title = toSafeString(
    remoteMessage.notification?.title ?? remoteMessage.data?.title,
    "New Notification"
  );
  const body = toSafeString(
    remoteMessage.notification?.body ?? remoteMessage.data?.body,
    "You received a new message."
  );

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: DEFAULT_NOTIFICATION_CHANNEL.id,
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
    },
  });
};

/**
 * Register listeners for foreground & background
 */
export const setupNotificationListeners = () => {
  const messaging = getMessaging();
  // Foreground listener
  onMessage(messaging, handleForegroundMessage);

  // Background/quit state handler
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log(" Background message:", remoteMessage);

    const title = toSafeString(
      remoteMessage.notification?.title ?? remoteMessage.data?.title,
      "Background Notification"
    );
    const body = toSafeString(
      remoteMessage.notification?.body ?? remoteMessage.data?.body,
      "You received a new message while app was in background."
    );

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: DEFAULT_NOTIFICATION_CHANNEL.id,
        importance: AndroidImportance.HIGH,
        pressAction: { id: "default" },
      },
    });
  });
};
