import notifee, {
  AuthorizationStatus as NotifeeAuthStatus,
  NotificationSettings,
} from "@notifee/react-native";
import { Alert, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { setupNotificationListeners } from "../utils/network/notificationListener";
import storageService from "./storageService";
import { storageKeys } from "../utils/cache/storageKeys";
import "../lib/firebase"; // Initialize firebase
import {
  getToken,
  getMessaging,
  hasPermission,
  requestPermission,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from "@react-native-firebase/messaging";
import {
  DEFAULT_NOTIFICATION_CHANNEL,
  FIREBASE_PERMISSION_CODE,
  FIREBASE_PERMISSION_STATUS,
} from "../constants/firebaseConstants";
import { withRetry } from "../utils/network/networkUtils";

type FirebaseAuthorizationStatusType =
  (typeof FIREBASE_PERMISSION_CODE)[keyof typeof FIREBASE_PERMISSION_CODE];

type CombinedPermissionStatus = {
  fcmStatus: FirebaseAuthorizationStatusType;
  notifeeStatus: NotifeeAuthStatus;
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
    const permissionsEnabled = await this.checkAndRequestPermissions();

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
    let fcmStatus: FirebaseAuthorizationStatusType =
      FIREBASE_PERMISSION_CODE[FIREBASE_PERMISSION_STATUS.NOT_DETERMINED]; // Default to NOT_DETERMINED numeric value
    let notifeeStatus = NotifeeAuthStatus.NOT_DETERMINED;
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        // hasPermission() returns the numeric value
        const permissionStatusValue = await hasPermission(getMessaging());
        // Assign directly to the numeric type variable
        fcmStatus = permissionStatusValue as FirebaseAuthorizationStatusType;

        const notifeeSettings: NotificationSettings =
          await notifee.getNotificationSettings();
        notifeeStatus = notifeeSettings.authorizationStatus;
      }
    } catch (error) {
      console.error("Error checking notification permissions:", error);
    }
    return { fcmStatus, notifeeStatus };
  }

  async checkAndRequestPermissions(): Promise<boolean> {
    console.log("Checking notification permissions...");

    // Load rejection count
    const rejectionKey = storageKeys.getNotificationRejectionCountKey();
    let rejectionCount =
      (await storageService.getItem<number>(rejectionKey)) ?? 0;

    // Check current status FIRST
    const currentStatus = await this.checkPermissions();
    console.log(
      "Current Permissions - FCM:",
      currentStatus.fcmStatus,
      "Notifee:",
      currentStatus.notifeeStatus
    );

    // Compare fcmStatus against numeric literals
    const FCM_AUTHORIZED =
      FIREBASE_PERMISSION_CODE[FIREBASE_PERMISSION_STATUS.AUTHORIZED];
    const FCM_PROVISIONAL =
      FIREBASE_PERMISSION_CODE[FIREBASE_PERMISSION_STATUS.PROVISIONAL];
    const FCM_DENIED =
      FIREBASE_PERMISSION_CODE[FIREBASE_PERMISSION_STATUS.DENIED];

    const fcmGranted = (
      [FCM_AUTHORIZED, FCM_PROVISIONAL] as FirebaseAuthorizationStatusType[]
    ).includes(currentStatus.fcmStatus);

    const notifeeGranted = [
      NotifeeAuthStatus.AUTHORIZED,
      NotifeeAuthStatus.PROVISIONAL,
    ].includes(currentStatus.notifeeStatus);

    if (fcmGranted && notifeeGranted) {
      console.log("Notification permissions already granted.");
      if (rejectionCount > 0) {
        console.log(
          "Resetting rejection count as permissions are now granted."
        );
        await storageService.setItem(rejectionKey, 0);
      }
      return true;
    }

    // Check rejection limit (Only if not currently granted)
    if (rejectionCount >= MAX_PERMISSION_REJECTIONS) {
      console.log(
        `Permission prompt skipped. Rejection limit (${MAX_PERMISSION_REJECTIONS}) previously reached.`
      );
      return false;
    }

    // Request if necessary (not granted and limit not reached)
    let finalFcmStatus = currentStatus.fcmStatus;
    let finalNotifeeStatus = currentStatus.notifeeStatus;
    let didRequestFcm = false;
    let didRequestNotifee = false;

    // Request FCM
    if (!fcmGranted && (Platform.OS === "ios" || Platform.OS === "android")) {
      console.log("Requesting FCM permission...");
      didRequestFcm = true;
      try {
        // requestPermission() returns the numeric value
        const permissionStatusValue = await requestPermission(getMessaging());
        finalFcmStatus =
          permissionStatusValue as FirebaseAuthorizationStatusType;
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
    const fcmDeniedAfterRequest =
      didRequestFcm && finalFcmStatus === FCM_DENIED;
    const notifeeDeniedAfterRequest =
      didRequestNotifee && finalNotifeeStatus === NotifeeAuthStatus.DENIED;

    if (fcmDeniedAfterRequest || notifeeDeniedAfterRequest) {
      console.log("Permission denied by user after prompt.");
      rejectionCount++;
      await storageService.setItem(rejectionKey, rejectionCount);
      console.log(`Rejection count updated to: ${rejectionCount}`);
    }

    // 7. Check final enabled status
    // FIX: Explicitly cast the array to include all numeric types for the check.
    const fcmEnabled = (
      [FCM_AUTHORIZED, FCM_PROVISIONAL] as FirebaseAuthorizationStatusType[]
    ).includes(finalFcmStatus);

    const notifeeEnabled = [
      NotifeeAuthStatus.AUTHORIZED,
      NotifeeAuthStatus.PROVISIONAL,
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
        console.log(
          `Rejection limit (${MAX_PERMISSION_REJECTIONS}) reached after this denial. Alert suppressed.`
        );
      }
    }

    return enabled;
  }

  async createDefaultChannel() {
    if (Platform.OS === "android") {
      try {
        // Use the constant object imported from firebaseConstants
        await notifee.createChannel(DEFAULT_NOTIFICATION_CHANNEL);
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
      const messaging = getMessaging();
      if (Platform.OS === "ios") {
        await registerDeviceForRemoteMessages(messaging);
      }
      const token = await getToken(messaging);

      if (token) {
        console.log("FCM Token obtained:", token.substring(0, 10) + "..."); // Log truncated token
        const { error } = await withRetry(() =>
          supabase
            .from("profiles")
            .update({ fcm_token: token })
            .eq("id", userId)
        );
        if (error) {
          console.error("Error saving FCM token:", error);
        } else {
          console.log("FCM token saved successfully for user:", userId);
        }
      } else {
        console.warn("Could not get FCM token.");
      }

      // Listen for token refresh
      onTokenRefresh(messaging, async (newToken) => {
        console.log("FCM token refreshed:", newToken.substring(0, 10) + "...");
        const { error: refreshError } = await withRetry(() =>
          supabase
            .from("profiles")
            .update({ fcm_token: newToken })
            .eq("id", userId)
        );
        if (refreshError)
          console.error("Error saving refreshed FCM token:", refreshError);
      });
    } catch (error) {
      console.error("Error in registerFCMToken:", error);
    }
  }

  async unregisterPushNotifications(userId?: string) {
    if (!userId) return;
    try {
      const { error } = await withRetry(() =>
        supabase.from("profiles").update({ fcm_token: null }).eq("id", userId)
      );

      if (error) {
        console.error("Failed to nullify FCM token on server:", error);
      } else {
        console.log(
          "Nullified FCM token on server successfully for user:",
          userId
        );
      }
    } catch (error) {
      console.error("Failed to unregister push notifications:", error);
    }
  }
}

export const notificationService = new NotificationService();
