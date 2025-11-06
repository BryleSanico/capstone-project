import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import * as RNP from 'react-native-permissions';
import { Platform, Alert } from 'react-native';
import { checkAndRequestPhotoPermission } from '../../../src/utils/validations/permissions';

// Spy on Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockedCheck = RNP.check as jest.Mock<
  (permission: RNP.Permission) => Promise<RNP.PermissionStatus>
>;
const mockedRequest = RNP.request as jest.Mock<
  (permission: RNP.Permission) => Promise<RNP.PermissionStatus>
>;

describe('utils/validations/permissions', () => {
  beforeEach(() => {
  jest.clearAllMocks();

  // Mock Platform values safely
  Object.defineProperty(Platform, 'OS', {
    value: 'ios',
    configurable: true,
  });

  Object.defineProperty(Platform, 'Version', {
    value: 15,
    configurable: true,
  });
});


  it('should return true if permission is already granted', async () => {
    // Use the imported RESULTS constant
    mockedCheck.mockResolvedValue(RNP.RESULTS.GRANTED);
    const hasPermission = await checkAndRequestPhotoPermission();
    expect(hasPermission).toBe(true);
    expect(mockedCheck).toHaveBeenCalledWith(RNP.PERMISSIONS.IOS.PHOTO_LIBRARY);
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('should return true if permission is limited (iOS)', async () => {
    mockedCheck.mockResolvedValue(RNP.RESULTS.LIMITED);
    const hasPermission = await checkAndRequestPhotoPermission();
    expect(hasPermission).toBe(true);
    expect(mockedCheck).toHaveBeenCalledWith(RNP.PERMISSIONS.IOS.PHOTO_LIBRARY);
  });

  it('should request permission if status is DENIED', async () => {
    mockedCheck.mockResolvedValue(RNP.RESULTS.DENIED);
    mockedRequest.mockResolvedValue(RNP.RESULTS.GRANTED); // User grants it

    const hasPermission = await checkAndRequestPhotoPermission();
    expect(hasPermission).toBe(true);
    expect(mockedCheck).toHaveBeenCalledTimes(1);
    expect(mockedRequest).toHaveBeenCalledWith(RNP.PERMISSIONS.IOS.PHOTO_LIBRARY);
  });

  it('should return false and alert if permission is BLOCKED', async () => {
    mockedCheck.mockResolvedValue(RNP.RESULTS.BLOCKED);

    const hasPermission = await checkAndRequestPhotoPermission();
    expect(hasPermission).toBe(false);
    expect(mockedRequest).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Permission Blocked',
      expect.any(String),
      expect.any(Array)
    );
  });

  it('should check for READ_MEDIA_IMAGES on Android 33+', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  Object.defineProperty(Platform, 'Version', { value: 33, configurable: true });

  mockedCheck.mockResolvedValue(RNP.RESULTS.GRANTED);
  await checkAndRequestPhotoPermission();

  expect(mockedCheck).toHaveBeenCalledWith(
    RNP.PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
  );
  });

  it('should check for READ_EXTERNAL_STORAGE on Android < 33', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    Object.defineProperty(Platform, 'Version', { value: 32, configurable: true });

    mockedCheck.mockResolvedValue(RNP.RESULTS.GRANTED);
    await checkAndRequestPhotoPermission();

    expect(mockedCheck).toHaveBeenCalledWith(
      RNP.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
    );
  });
});