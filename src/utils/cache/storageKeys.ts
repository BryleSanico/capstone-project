/**
 * A centralized utility for generating keys for AsyncStorage.
 * This prevents key name duplication and makes cache management easier.
 */
const NOTIFICATION_PERMISSION_REJECTION_COUNT_KEY =
  "notification_permission_rejection_count";

export const storageKeys = {
  // App-Wide Keys
  getNotificationRejectionCountKey: () =>
    NOTIFICATION_PERMISSION_REJECTION_COUNT_KEY,
};
