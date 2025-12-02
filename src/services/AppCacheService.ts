import storageService from './storageService';
import EncryptedStorage from 'react-native-encrypted-storage';
import { supabase } from '../lib/supabase';
import { clearPrivateData } from './sqliteService';

/**
 * Clears all non-sensitive app cache data from AsyncStorage.
 * This does NOT clear secure storage (auth tokens).
 */
async function clearAllAppCaches(): Promise<void> {
  try {
    await storageService.clearAll();
    console.log('[AppCacheService] All app caches (AsyncStorage) cleared.');
  } catch (error) {
    console.error('[AppCacheService] Failed to clear app caches:', error);
  }
}

/**
 * [DEV-ONLY] Clears all data from EncryptedStorage (Keychain/Keystore).
 * This is a destructive operation and should only be used for debugging.
 *
 * This function is moved from 'storageAdapter.ts' to its correct home.
 */
async function clearAllSecureStorage(): Promise<void> {
  if (!__DEV__) {
    console.warn(
      '[AppCacheService] clearAllSecureStorage was called in production. Aborting.'
    );
    return;
  }
  try {
    console.log(
      '[AppCacheService] [DEV] Clearing all secure storage...'
    );
    await EncryptedStorage.clear();
    console.log(
      '[AppCacheService] [DEV] All secure storage cleared.'
    );
  } catch (error) {
    console.error(
      '[AppCacheService] [DEV] Error clearing secure storage:',
      error
    );
  }
}

/**
 * The primary orchestration function for a clean user logout.
 * It clears all user-specific cache data AND all secure auth data.
 *
 * @param userId The ID of the user logging out.
 */
async function handleLogout(_id: string): Promise<void> {
  console.log('[AppCacheService] Handling logout procedures...');
  // Clear all non-sensitive cache data (tickets, favorites, etc.)
  await clearPrivateData();

  // Clear all sensitive data (auth tokens) from EncryptedStorage.
  // Call Supabase's signOut(), which in turn calls
  // storageAdapter.removeItem() for all its keys.

  const response = await supabase.auth.signOut();
  
  if (response.error) {
     console.error('[AppCacheService] Error during Supabase signOut:', response.error.message);
  } else {
     console.log('[AppCacheService] Supabase session signed out and secure storage cleared.');
  }
}

export const AppCacheService = {
  clearAllAppCaches,
  clearAllSecureStorage,
  handleLogout,
};