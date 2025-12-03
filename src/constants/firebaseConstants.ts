import { AndroidImportance } from "@notifee/react-native";

/**
 * Notification channel constants for Android
 */
export const DEFAULT_NOTIFICATION_CHANNEL = {
  id: "default",
  name: "Default Channel",
  importance: AndroidImportance.HIGH,
};

/**
 * Human-readable permission status mapping
 */
export const FIREBASE_PERMISSION_STATUS = {
  AUTHORIZED: "AUTHORIZED",
  DENIED: "DENIED",
  NOT_DETERMINED: "NOT_DETERMINED",
  PROVISIONAL: "PROVISIONAL",
} as const;

export type FirebasePermissionStatus =
  (typeof FIREBASE_PERMISSION_STATUS)[keyof typeof FIREBASE_PERMISSION_STATUS];

/**
 * Numeric mapping to match Firebase's native values
 */
export const FIREBASE_PERMISSION_CODE = {
  [FIREBASE_PERMISSION_STATUS.NOT_DETERMINED]: -1,
  [FIREBASE_PERMISSION_STATUS.DENIED]: 0,
  [FIREBASE_PERMISSION_STATUS.AUTHORIZED]: 1,
  [FIREBASE_PERMISSION_STATUS.PROVISIONAL]: 2, // iOS only
} as const;
