import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../utils/system/logger";

/**
 * A generic service to handle all interactions with AsyncStorage.
 * This centralizes the logic for serialization and deserialization.
 */
export const storageService = {
  /**
   * Retrieves and deserializes a JSON item from AsyncStorage.
   * @param key The key of the item to retrieve.
   * @returns The parsed item, or null if not found or on error.
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      logger.error(`Failed to get ${key}:`, e);
      return null;
    }
  },

  /**
   * Serializes and saves an item to AsyncStorage.
   * @param key The key to save the item under.
   * @param value The value to save.
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      logger.error(`Failed to save ${key}:`, e);
    }
  },

  /**
   * Removes an item from AsyncStorage.
   * @param key The key of the item to remove.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      logger.error(`Failed to remove ${key}:`, e);
    }
  },

  // Clears all data from AsyncStorage.
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      logger.error("Failed to clear storage:", e);
    }
  },
};

export default storageService;
