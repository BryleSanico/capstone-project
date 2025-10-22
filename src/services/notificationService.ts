// src/services/notificationService.ts
import messaging from "@react-native-firebase/messaging";
import notifee, {
  AndroidImportance,
  AuthorizationStatus as NotifeeAuthStatus, // Keep using Notifee's enum/alias
  NotificationSettings,
} from "@notifee/react-native";
import { Alert, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { setupNotificationListeners } from "../utils/notificationListener";
import storageService from "./storageService"; // Import storage service
import { storageKeys } from "../utils/storageKeys"; // Import storage keys

// Explicit numeric literal type for Firebase status to avoid type/value confusion
type FirebaseAuthorizationStatusType =
  | -1 // NOT_DETERMINED (Adjust if messaging uses -1, check library docs if needed, often 0)
  | 0 // DENIED (Adjust if messaging uses 0, check library docs if needed, often 1)
  | 1 // AUTHORIZED (Adjust if messaging uses 1, check library docs if needed, often 2)
  | 2; // PROVISIONAL (iOS) (Adjust if messaging uses 2, check library docs if needed, often 3)
  // NOTE: Double-check the actual numeric values returned by messaging().hasPermission() and requestPermission()
  // as they might differ slightly from the enum definition. Common values are used here.

// Map numeric values to FirebaseAuthorizationStatus enum for clearer logic later if needed (optional)
// const FirebaseStatusMap = {
//   NOT_DETERMINED: -1,
//   DENIED: 0,
//   AUTHORIZED: 1,
//   PROVISIONAL: 2,
// };
// Use numeric literals directly for now.

type CombinedPermissionStatus = {
  fcmStatus: FirebaseAuthorizationStatusType; // Use the numeric type
  notifeeStatus: NotifeeAuthStatus; // Use Notifee's enum/alias
};

const MAX_PERMISSION_REJECTIONS = 3;

class NotificationService {
  private isInitialized = false;

  async initialize(userId?: string) {
    if (this.isInitialized) {
        console.log("NotificationService already initialized.");
        if (userId) await this.registerFCMToken(userId);
        return;
    }
    console.log("Initializing NotificationService...");

    await this.createDefaultChannel();
    const permissionsEnabled = await this.checkAndRequestPermissions(); // This now includes rejection logic

    if (permissionsEnabled && userId) {
      await this.registerFCMToken(userId);
    }

    // Setup listeners regardless of permission status, in case status changes later
    setupNotificationListeners();
    this.isInitialized = true;
    console.log("NotificationService initialization complete.");
  }

  // Check current permission status
  async checkPermissions(): Promise<CombinedPermissionStatus> {
    let fcmStatus: FirebaseAuthorizationStatusType = -1; // Default to NOT_DETERMINED numeric value
    let notifeeStatus = NotifeeAuthStatus.NOT_DETERMINED;
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // hasPermission() returns the numeric value
        const permissionStatusValue = await messaging().hasPermission();
        // Assign directly to the numeric type variable
        fcmStatus = permissionStatusValue as FirebaseAuthorizationStatusType;

        const notifeeSettings: NotificationSettings = await notifee.getNotificationSettings();
        notifeeStatus = notifeeSettings.authorizationStatus;
      }
    } catch (error) {
        console.error("Error checking notification permissions:", error);
    }
    return { fcmStatus, notifeeStatus };
  }


  // Updated method with refined rejection tracking and reset logic
  async checkAndRequestPermissions(): Promise<boolean> {
      console.log("Checking notification permissions...");

      // 1. Load rejection count
      const rejectionKey = storageKeys.getNotificationRejectionCountKey();
      let rejectionCount = (await storageService.getItem<number>(rejectionKey)) ?? 0;

      // 2. Check current status FIRST
      const currentStatus = await this.checkPermissions();
      console.log("Current Permissions - FCM:", currentStatus.fcmStatus, "Notifee:", currentStatus.notifeeStatus);

      // Compare fcmStatus against numeric literals
      const FCM_AUTHORIZED = 1; // Assuming 1 maps to AUTHORIZED
      const FCM_PROVISIONAL = 2; // Assuming 2 maps to PROVISIONAL (iOS)
      const FCM_DENIED = 0; // Assuming 0 maps to DENIED

      const fcmGranted = [FCM_AUTHORIZED, FCM_PROVISIONAL].includes(
        currentStatus.fcmStatus
      );

      const notifeeGranted = [
          NotifeeAuthStatus.AUTHORIZED,
          NotifeeAuthStatus.PROVISIONAL
      ].includes(currentStatus.notifeeStatus);

      // 3. Handle currently granted (Reset counter if needed)
      if (fcmGranted && notifeeGranted) {
          console.log("✅ Notification permissions already granted.");
          if (rejectionCount > 0) {
              console.log("Resetting rejection count as permissions are now granted.");
              await storageService.setItem(rejectionKey, 0);
          }
          return true; // Skip prompts and alerts
      }

      // 4. Check rejection limit (Only if not currently granted)
      if (rejectionCount >= MAX_PERMISSION_REJECTIONS) {
          console.log(`Permission prompt skipped. Rejection limit (${MAX_PERMISSION_REJECTIONS}) previously reached.`);
          return false;
      }

      // 5. Request if necessary (not granted and limit not reached)
      let finalFcmStatus = currentStatus.fcmStatus;
      let finalNotifeeStatus = currentStatus.notifeeStatus;
      let didRequestFcm = false;
      let didRequestNotifee = false;

      // Request FCM
      if (!fcmGranted && (Platform.OS === 'ios' || Platform.OS === 'android')) {
          console.log("Requesting FCM permission...");
          didRequestFcm = true;
          try {
              // requestPermission() returns the numeric value
              const permissionStatusValue = await messaging().requestPermission();
              finalFcmStatus = permissionStatusValue as FirebaseAuthorizationStatusType;
              console.log("FCM Permission Request Result:", finalFcmStatus);
          } catch (error) {
              console.error("Error requesting FCM permission:", error);
              finalFcmStatus = FCM_DENIED; // Assume denied numeric value on error
          }
      }

      // Request Notifee
      if (!notifeeGranted) {
           console.log("Requesting Notifee permission...");
           didRequestNotifee = true;
           try {
               const settings = await notifee.requestPermission();
               finalNotifeeStatus = settings.authorizationStatus;
               console.log("Notifee Permission Request Result:", finalNotifeeStatus);
           } catch (error) {
               console.error("Error requesting Notifee permission:", error);
               finalNotifeeStatus = NotifeeAuthStatus.DENIED; // Assume denied enum value on error
           }
      }

      // 6. Process result & update rejection count
      // Use numeric literal for FCM comparison
      const fcmDeniedAfterRequest = didRequestFcm && finalFcmStatus === FCM_DENIED;
      const notifeeDeniedAfterRequest = didRequestNotifee && finalNotifeeStatus === NotifeeAuthStatus.DENIED;

      if (fcmDeniedAfterRequest || notifeeDeniedAfterRequest) {
          console.log("Permission denied by user after prompt.");
          rejectionCount++;
          await storageService.setItem(rejectionKey, rejectionCount);
          console.log(`Rejection count updated to: ${rejectionCount}`);
      }

      // 7. Check final enabled status
      // Use numeric literals for FCM comparison
      const fcmEnabled = [FCM_AUTHORIZED, FCM_PROVISIONAL].includes(finalFcmStatus);
      const notifeeEnabled = [
           NotifeeAuthStatus.AUTHORIZED,
           NotifeeAuthStatus.PROVISIONAL
       ].includes(finalNotifeeStatus);
      const enabled = fcmEnabled && notifeeEnabled;

      // 8. Conditional alert & Reset Count on Grant
      if (enabled) {
          console.log("✅ Notification permissions are enabled after request.");
          if (rejectionCount > 0) {
             console.log("Resetting rejection count after permission granted.");
             await storageService.setItem(rejectionKey, 0);
          }
      } else {
          if (rejectionCount < MAX_PERMISSION_REJECTIONS) {
              Alert.alert(
                  "Notification Permission",
                  "Notifications might be disabled. Please check Settings to enable them for the best experience."
              );
          } else {
              console.log(`Rejection limit (${MAX_PERMISSION_REJECTIONS}) reached after this denial. Alert suppressed.`);
          }
      }

      return enabled;
  }


  async createDefaultChannel() {
    if (Platform.OS === "android") {
        try {
            await notifee.createChannel({
                id: "default",
                name: "Default Channel",
                importance: AndroidImportance.HIGH,
            });
            console.log("Default notification channel created.");
        } catch (error) {
            console.error("Error creating notification channel:", error);
        }
    }
  }

  async registerFCMToken(userId?: string) {
    if (!userId) {
        console.warn("Cannot register FCM token without userId.");
        return;
    }
    try {
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      const token = await messaging().getToken();

      if (token) {
        console.log("FCM Token obtained:", token.substring(0, 10) + "..."); // Log truncated token
        const { error } = await supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", userId);
        if (error) {
            console.error("Error saving FCM token:", error);
        } else {
            console.log("FCM token saved successfully for user:", userId);
        }
      } else {
          console.warn("Could not get FCM token.");
      }

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        console.log("FCM token refreshed:", newToken.substring(0, 10) + "...");
        const { error: refreshError } = await supabase
            .from("profiles")
            .update({ fcm_token: newToken })
            .eq("id", userId);
        if (refreshError) console.error("Error saving refreshed FCM token:", refreshError);
      });
    } catch (error) {
      console.error("Error in registerFCMToken:", error);
    }
  }

  async unregisterPushNotifications(userId?: string) {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ fcm_token: null })
        .eq("id", userId);

      if (error) {
        console.error("Failed to nullify FCM token on server:", error);
      } else {
        console.log("Nullified FCM token on server successfully for user:", userId);
      }
    } catch (error) {
      console.error("Failed to unregister push notifications:", error);
    }
  }
}

export const notificationService = new NotificationService();

