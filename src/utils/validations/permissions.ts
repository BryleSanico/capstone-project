import { Platform, Alert } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

const PLATFORM_PHOTO_LIBRARY_PERMISSIONS = {
  ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  android: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, // Use READ_MEDIA_IMAGES for >= API 33
};
const PLATFORM_LEGACY_STORAGE_PERMISSION = {
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE // For < API 33
}

const requestPermission = async (permission: Permission): Promise<boolean> => {
  try {
    const result = await request(permission);
    switch (result) {
      case RESULTS.GRANTED:
        console.log(`Permission ${permission} granted`);
        return true;
      case RESULTS.DENIED:
        console.log(`Permission ${permission} denied`);
        Alert.alert('Permission Denied', 'Cannot access photos without permission.');
        return false;
      case RESULTS.BLOCKED:
        console.log(`Permission ${permission} blocked`);
        Alert.alert(
          'Permission Blocked',
          'Photo library access is blocked. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      case RESULTS.LIMITED: // iOS specific
         console.log(`Permission ${permission} limited`);
         return true; // Still allow access for limited selection
      case RESULTS.UNAVAILABLE:
        console.log(`Permission ${permission} unavailable on this device`);
        Alert.alert('Feature Unavailable', 'Photo library access is not available on this device.');
        return false;
    }
  } catch (error) {
    console.error(`Error requesting permission ${permission}:`, error);
    Alert.alert('Permission Error', 'Could not request photo library permission.');
    return false;
  }
};


export const checkAndRequestPhotoPermission = async (): Promise<boolean> => {
    let permission: Permission | null = null;

    if (Platform.OS === 'ios') {
        permission = PLATFORM_PHOTO_LIBRARY_PERMISSIONS.ios;
    } else if (Platform.OS === 'android') {
        // Check API level for Android permission
        const androidVersion = Platform.Version;
        if (typeof androidVersion === 'number' && androidVersion >= 33) {
            permission = PLATFORM_PHOTO_LIBRARY_PERMISSIONS.android;
        } else {
             permission = PLATFORM_LEGACY_STORAGE_PERMISSION.android;
        }
    }

    if (!permission) {
        console.error("Unsupported platform for photo permission");
        return false;
    }


    try {
        const status = await check(permission);
        if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
            return true;
        }
        if (status === RESULTS.DENIED) { // Only request if denied, not blocked
            return await requestPermission(permission);
        }
         if (status === RESULTS.BLOCKED) {
             Alert.alert(
                'Permission Blocked',
                'Photo library access is blocked. Please enable it in your device settings.',
                [{ text: 'OK' }]
            );
            return false;
        }
         if (status === RESULTS.UNAVAILABLE) {
            Alert.alert('Feature Unavailable', 'Photo library access is not available on this device.');
            return false;
         }

    } catch (error) {
        console.error(`Error checking permission ${permission}:`, error);
        Alert.alert('Permission Error', 'Could not check photo library permission.');
        return false;
    }
    return false; // Fallback
};