import notifee, {
  AuthorizationStatus as NotifeeAuthStatus,
  NotificationSettings,
} from "@notifee/react-native";
import { Alert, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { setupNotificationListeners } from "../utils/network/notificationListener";
import storageService from "./storageService";
import { storageKeys } from "../utils/cache/storageKeys";
import "../lib/firebase";
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
import { logger } from "../utils/system/logger";

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
      logger.info("NotificationService already initialized.");
      if (userId) await this.registerFCMToken(userId);
      return;
    }
    logger.info("Initializing NotificationService...");

    await this.createDefaultChannel();
    const permissionsEnabled = await this.checkAndRequestPermissions();

    if (permissionsEnabled && userId) {
      await this.registerFCMToken(userId);
    }

    // Setup listeners regardless of permission status, in case status changes later
    setupNotificationListeners();
    this.isInitialized = true;
    logger.info("NotificationService initialization complete.");
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
    logger.info("Checking notification permissions...");

    // Load rejection count
    const rejectionKey = storageKeys.getNotificationRejectionCountKey();
    let rejectionCount =
      (await storageService.getItem<number>(rejectionKey)) ?? 0;

    // Check current status FIRST
    const currentStatus = await this.checkPermissions();
    logger.info(
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
      logger.info("Notification permissions already granted.");
      if (rejectionCount > 0) {
        logger.info(
          "Resetting rejection count as permissions are now granted."
        );
        await storageService.setItem(rejectionKey, 0);
      }
      return true;
    }

    // Check rejection limit (Only if not currently granted)
    if (rejectionCount >= MAX_PERMISSION_REJECTIONS) {
      logger.info(
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
      logger.info("Requesting FCM permission...");
      didRequestFcm = true;
      try {
        // requestPermission() returns the numeric value
        const permissionStatusValue = await requestPermission(getMessaging());
        finalFcmStatus =
          permissionStatusValue as FirebaseAuthorizationStatusType;
        logger.info("FCM Permission Request Result:", finalFcmStatus);
      } catch (error) {
        logger.error("Error requesting FCM permission:", error);
        finalFcmStatus = FCM_DENIED;
      }
    }

    // Request Notifee
    if (!notifeeGranted) {
      logger.info("Requesting Notifee permission...");
      didRequestNotifee = true;
      try {
        const settings = await notifee.requestPermission();
        finalNotifeeStatus = settings.authorizationStatus;
        logger.info("Notifee Permission Request Result:", finalNotifeeStatus);
      } catch (error) {
        logger.error("Error requesting Notifee permission:", error);
        finalNotifeeStatus = NotifeeAuthStatus.DENIED;
      }
    }

    // 6. Process result & update rejection count
    // Use numeric literal for FCM comparison
    const fcmDeniedAfterRequest =
      didRequestFcm && finalFcmStatus === FCM_DENIED;
    const notifeeDeniedAfterRequest =
      didRequestNotifee && finalNotifeeStatus === NotifeeAuthStatus.DENIED;

    if (fcmDeniedAfterRequest || notifeeDeniedAfterRequest) {
      logger.info("Permission denied by user after prompt.");
      rejectionCount++;
      await storageService.setItem(rejectionKey, rejectionCount);
      logger.info(`Rejection count updated to: ${rejectionCount}`);
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
      logger.info("✅ Notification permissions are enabled after request.");
      if (rejectionCount > 0) {
        logger.info("Resetting rejection count after permission granted.");
        await storageService.setItem(rejectionKey, 0);
      }
    } else {
      if (rejectionCount < MAX_PERMISSION_REJECTIONS) {
        Alert.alert(
          "Notification Permission",
          "Notifications might be disabled. Please check Settings to enable them for the best experience."
        );
      } else {
        logger.info(
          `Rejection limit (${MAX_PERMISSION_REJECTIONS}) reached after this denial. Alert suppressed.`
        );
      }
    }

    return enabled;
  }

  async createDefaultChannel() {
    if (Platform.OS === "android") {
      try {
        await notifee.createChannel(DEFAULT_NOTIFICATION_CHANNEL);
        logger.info("Default notification channel created.");
      } catch (error) {
        logger.error("Error creating notification channel:", error);
      }
    }
  }

  async registerFCMToken(userId?: string) {
    if (!userId) {
      logger.warn("Cannot register FCM token without userId.");
      return;
    }
    try {
      const messaging = getMessaging();
      if (Platform.OS === "ios") {
        await registerDeviceForRemoteMessages(messaging);
      }
      const token = await getToken(messaging);

      if (token) {
        logger.info("FCM Token obtained:", token.substring(0, 10) + "...");
        const { error } = await withRetry(() =>
          supabase
            .from("profiles")
            .update({ fcm_token: token })
            .eq("id", userId)
        );
        if (error) {
          logger.error("Error saving FCM token:", error);
        } else {
          logger.info("FCM token saved successfully for user:", userId);
        }
      } else {
        logger.warn("Could not get FCM token.");
      }

      onTokenRefresh(messaging, async (newToken) => {
        logger.info("FCM token refreshed:", newToken.substring(0, 10) + "...");
        const { error: refreshError } = await withRetry(() =>
          supabase
            .from("profiles")
            .update({ fcm_token: newToken })
            .eq("id", userId)
        );
        if (refreshError) {
          logger.error("Error saving refreshed FCM token:", refreshError);
        }
      });
    } catch (error) {
      logger.error("Error in registerFCMToken:", error);
    }
  }

  async unregisterPushNotifications(userId?: string) {
    if (!userId) return;
    try {
      const { error } = await withRetry(() =>
        supabase.from("profiles").update({ fcm_token: null }).eq("id", userId)
      );

      if (error) {
        logger.error("Failed to nullify FCM token on server:", error);
      } else {
        logger.info(
          "Nullified FCM token on server successfully for user:",
          userId
        );
      }
    } catch (error) {
      logger.error("Failed to unregister push notifications:", error);
    }
  }
}

export const notificationService = new NotificationService();
