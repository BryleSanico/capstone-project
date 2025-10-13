import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * A generic service to handle all interactions with AsyncStorage.
 * This centralizes the logic for serialization and deserialization.
 */
const storageService = {
  /**
   * Retrieves and deserializes a JSON item from AsyncStorage.
   * @param key The key of the item to retrieve.
   * @returns The parsed item, or null if not found or on error.
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) as T : null;
    } catch (e) {
      console.error(`Failed to get item with key "${key}" from storage`, e);
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
      console.error(`Failed to set item with key "${key}" in storage`, e);
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
      console.error(`Failed to remove item with key "${key}" from storage`, e);
    }
  },
  
  // Clears all data from AsyncStorage.
  async clearAll(): Promise<void> {
    try {
        await AsyncStorage.clear();
    } catch(e) {
        console.error('Failed to clear all data from storage', e);
    }
  }
};

export default storageService;
