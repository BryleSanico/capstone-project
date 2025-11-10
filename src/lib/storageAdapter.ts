import EncryptedStorage from 'react-native-encrypted-storage';
import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * A custom Supabase storage adapter that uses `react-native-encrypted-storage`
 * (Keychain on iOS, EncryptedSharedPreferences on Android).
 * This ensures that session data is stored securely on the device.
 */
export const StorageAdapter: SupportedStorage = {
  /**
   * Saves the session to secure storage.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (error) {
      console.error('SecureSupabaseStorage: Error setting item', error);
      throw error;
    }
  },

  /**
   * Retrieves the session from secure storage.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const secureValue = await EncryptedStorage.getItem(key);
      return secureValue || null;
    } catch (error) {
      console.error('SecureSupabaseStorage: Error getting item', error);
      return null;
    }
  },

  /**
   * Removes the session from secure storage.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      console.error('SecureSupabaseStorage: Error removing item', error);
      throw error;
    }
  },
};