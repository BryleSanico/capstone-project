import EncryptedStorage from "react-native-encrypted-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";
import { logger } from "../utils/system/logger";

const MIGRATED_FLAG = "@storage_migrated_to_secure";
let migrationChecked = false; // In-memory flag to prevent repeated checks

/**
 * A custom Supabase storage adapter that uses `react-native-encrypted-storage`
 * (Keychain on iOS, EncryptedSharedPreferences on Android).
 *
 * On first use, it migrates any existing session from AsyncStorage to EncryptedStorage.
 */
export const StorageAdapter: SupportedStorage = {
  /**
   * Saves the session to secure storage.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(key, value);
      logger.info(
        `[StorageAdapter] Saved to secure storage: ${key.substring(0, 30)}...`
      );
    } catch (error) {
      logger.error("[StorageAdapter] Error setting item:", error);
      throw error;
    }
  },

  /**
   * Retrieves the session from secure storage.
   * On first call, attempts to migrate from AsyncStorage if data exists there.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // Check if we've already migrated (use in-memory flag to avoid repeated checks)
      if (!migrationChecked) {
        const hasMigrated = await EncryptedStorage.getItem(MIGRATED_FLAG);

        if (!hasMigrated) {
          logger.info(
            "[StorageAdapter] First time - checking for migration..."
          );
          // Attempt migration from AsyncStorage
          const oldValue = await AsyncStorage.getItem(key);

          if (oldValue) {
            logger.info(
              "[StorageAdapter] Found data in AsyncStorage, migrating..."
            );
            // Move to secure storage
            await EncryptedStorage.setItem(key, oldValue);
            // Remove from insecure storage
            await AsyncStorage.removeItem(key);
            logger.info("[StorageAdapter] Migration complete");
          }

          // Mark as migrated (both in memory and storage)
          await EncryptedStorage.setItem(MIGRATED_FLAG, "true");
          migrationChecked = true;

          if (oldValue) {
            return oldValue;
          }
        } else {
          migrationChecked = true;
        }
      }

      // Get from secure storage
      const secureValue = await EncryptedStorage.getItem(key);

      if (secureValue) {
        logger.info(`[StorageAdapter] Retrieved from secure storage: FOUND`);
      }

      return secureValue || null;
    } catch (error) {
      logger.error("[StorageAdapter] Error getting item:", error);
      return null;
    }
  },

  /**
   * Removes the session from secure storage.
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Try to remove from secure storage
      try {
        await EncryptedStorage.removeItem(key);
        logger.info(
          `[StorageAdapter] Removed from secure storage: ${key.substring(0, 30)}...`
        );
      } catch (error: any) {
        logger.info(
          `[StorageAdapter] Secure key not found or already removed: ${key.substring(0, 30)}...`,
          error.message
        );
      }

      // Try to remove from AsyncStorage
      try {
        await AsyncStorage.removeItem(key);
        logger.info(
          `[StorageAdapter] Removed from async storage: ${key.substring(0, 30)}...`
        );
      } catch (error) {
        logger.warn(
          "[StorageAdapter] Error removing from async storage:",
          error
        );
      }
    } catch (error) {
      logger.error("[StorageAdapter] Unexpected error in removeItem:", error);
    }
  },
};

/**
 * Utility function to completely clear all secure storage.
 * Useful for development/testing or manual logout.
 */
export const clearAllSecureStorage = async (): Promise<void> => {
  try {
    logger.info("[StorageAdapter] 🧹 Clearing all secure storage...");
    await EncryptedStorage.clear();
    migrationChecked = false;
    logger.info("[StorageAdapter] All secure storage cleared");
  } catch (error) {
    logger.error("[StorageAdapter] Error clearing secure storage:", error);
    throw error;
  }
};
 