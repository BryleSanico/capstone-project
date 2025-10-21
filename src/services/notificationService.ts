// src/services/notificationService.ts
import messaging from "@react-native-firebase/messaging";
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from "@notifee/react-native";
import { Alert, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { setupNotificationListeners } from "../utils/notificationListener";

class NotificationService {
  async initialize(userId?: string) {
    // Request permission
    const permissionGranted = await this.requestPermission();
    // Create channel
    await this.createDefaultChannel();

    // Only register for a token if permission was granted
    if (permissionGranted) {
      await this.registerFCMToken(userId);
    }

    // Set up listeners regardless
    setupNotificationListeners(); //  Listen after setup
  }

  async requestPermission(): Promise<boolean> {
    let authStatus;
    
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // Request permission for remote notifications (APNs)
      authStatus = await messaging().requestPermission();

      // Request permission for local display (Notifee)
      await notifee.requestPermission();
    } 

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("Notification permission granted.");
    } else {
      Alert.alert(
        "Notification Permission",
        "Notifications are disabled. Please enable them in Settings."
      );
    }
    return enabled;
  }

  async createDefaultChannel() {
    if (Platform.OS === "android") {
      await notifee.createChannel({
        id: "default",
        name: "Default Channel",
        importance: AndroidImportance.HIGH,
      });
    }
  }

  async registerFCMToken(userId?: string) {
    try {
      // For iOS to get a token.
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();

      if (token) {
        console.log("FCM Token:", token);
        if (userId) {
          const { error } = await supabase
            .from("profiles")
            .update({ fcm_token: token })
            .eq("id", userId);
          if (error) console.error("Error saving FCM token:", error);
        }
      }

      messaging().onTokenRefresh(async (newToken) => {
        console.log("FCM token refreshed:", newToken);
        if (userId) {
          await supabase
            .from("profiles")
            .update({ fcm_token: newToken })
            .eq("id", userId);
        }
      });
    } catch (error) {
      console.error("Error registering FCM token:", error);
    }
  }

  async unregisterPushNotifications(userId?: string) {
    try {
      await messaging().deleteToken();

      if (userId) {
        await supabase
          .from("profiles")
          .update({ fcm_token: null })
          .eq("id", userId);
      }

      console.log("Unregistered push notifications successfully");
    } catch (error) {
      console.error("Failed to unregister push notifications:", error);
    }
  }
}

export const notificationService = new NotificationService();