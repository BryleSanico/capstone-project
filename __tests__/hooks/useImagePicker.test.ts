import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import {
  ImagePickerResponse,
  ImageLibraryOptions,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import { checkAndRequestPhotoPermission } from '../../src/utils/validations/permissions';
import * as validationUtils from '../../src/utils/validations/validation';
import { useImagePicker } from '../../src/hooks/useImagePicker';

// Mock the other dependencies
jest.mock('../../src/utils/validations/permissions');
jest.mock('../../src/utils/validations/validation');

// Cast the imported mock functions to their full types
const mockedLaunchImageLibrary = launchImageLibrary as unknown as jest.Mock<
  (
    options: ImageLibraryOptions,
    callback: (response: ImagePickerResponse) => void
  ) => void
>;

const mockedCheckPermission = checkAndRequestPhotoPermission as jest.Mock<
  () => Promise<boolean>
>;
const mockedValidateFileType =
  validationUtils.validateFileType as jest.Mock<
    (fileType: string | undefined | null, allowedTypes: string[]) => boolean
  >;
const mockedValidateFileSize =
  validationUtils.validateFileSize as jest.Mock<
    (fileSize: number | undefined | null, maxSizeMB: number) => boolean
  >;
const mockedHasBase64Data = validationUtils.hasBase64Data as jest.Mock<
  (base64: string | undefined | null) => boolean
>;

// Fully type the mock asset
const mockSuccessAsset: Asset = {
  uri: 'file:///image.jpg',
  type: 'image/jpeg',
  fileSize: 1000,
  base64: 'mock-base64-data',
  fileName: 'image.jpg',
};

describe('hooks/useImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default all mock implementations to success
    mockedCheckPermission.mockResolvedValue(true);
    mockedValidateFileType.mockReturnValue(true);
    mockedValidateFileSize.mockReturnValue(true);
    mockedHasBase64Data.mockReturnValue(true);
  });

  it('should not launch library if permission is denied', async () => {
    mockedCheckPermission.mockResolvedValue(false);
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(mockedCheckPermission).toHaveBeenCalled();
    expect(mockedLaunchImageLibrary).not.toHaveBeenCalled();
    expect(result.current.imageAsset).toBeNull();
  });

  it('should set imageAsset on successful selection and validation', async () => {
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [mockSuccessAsset] });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(mockedCheckPermission).toHaveBeenCalled();
    expect(mockedValidateFileType).toHaveBeenCalled();
    expect(mockedValidateFileSize).toHaveBeenCalled();
    expect(mockedHasBase64Data).toHaveBeenCalled();
    expect(result.current.imageAsset).toEqual(mockSuccessAsset);
    expect(result.current.imageError).toBeNull();
  });

  it('should set an error if file type is invalid', async () => {
    mockedValidateFileType.mockReturnValue(false);
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [mockSuccessAsset] });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageAsset).toBeNull();
    expect(result.current.imageError).toBe(
      'Invalid file type. Please select a JPG or PNG.'
    );
  });

  it('should set an error if file size is invalid', async () => {
    mockedValidateFileSize.mockReturnValue(false);
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [mockSuccessAsset] });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageAsset).toBeNull();
    expect(result.current.imageError).toContain('Image is too large');
  });

  it('should not set an error if user cancels picker', async () => {
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ didCancel: true });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageAsset).toBeNull();
    expect(result.current.imageError).toBeNull();
  });

  it('should set displayImageUri to imageAsset.uri if present', async () => {
    const { result } = renderHook(() => useImagePicker());
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [mockSuccessAsset] });
    });
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.displayImageUri).toBe(mockSuccessAsset.uri);
  });

  it('should set displayImageUri to currentImageUrl if asset is null', () => {
    const { result } = renderHook(() => useImagePicker());
    const existingUrl = 'http://existing.url/image.jpg';
    act(() => {
      result.current.setCurrentImageUrl(existingUrl);
    });
    expect(result.current.displayImageUri).toBe(existingUrl);
  });

  it('should set an error if permission check itself fails', async () => {
    mockedCheckPermission.mockRejectedValue(
      new Error('Permission module crash')
    );
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(mockedLaunchImageLibrary).not.toHaveBeenCalled();
    expect(result.current.imageError).toBe(
      'A problem occurred while checking permissions.'
    );
  });

  it('should set permission error if launchImageLibrary returns permission error', async () => {
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ errorCode: 'permission' });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageError).toBe(
      'Cannot access photos. Please enable permission in settings.'
    );
  });

  // --- REPLACEMENT FOR THE BROKEN TESTS ---

  it('should set a generic error if launchImageLibrary returns an error message', async () => {
    // This test covers the `response.errorMessage` part
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ errorCode: 'camera_unavailable', errorMessage: 'Camera busy' });
    });
    const { result } = renderHook(() => useImagePicker());

    await act(async () => {
      await result.current.handleChoosePhoto();
    });

    expect(result.current.imageError).toBe('Camera busy');
  });

  it('should set a fallback error if launchImageLibrary returns error code but no message', async () => {
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ errorCode: 'others', errorMessage: undefined });
    });
    const { result } = renderHook(() => useImagePicker());

    await act(async () => {
      await result.current.handleChoosePhoto();
    });

    expect(result.current.imageError).toBe('Could not select image.');
  });
  // --- END REPLACEMENT ---

  it('should set an error if base64 data is missing', async () => {
    mockedHasBase64Data.mockReturnValue(false);
    mockedLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [mockSuccessAsset] });
    });
    const { result } = renderHook(() => useImagePicker());
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageAsset).toBeNull();
    expect(result.current.imageError).toBe(
      'Could not read image data (base64 missing).'
    );
  });

  it('clearImageError should reset a set error', async () => {
    const { result } = renderHook(() => useImagePicker());

    // 1. Set an error
    mockedCheckPermission.mockRejectedValue(new Error('Test Error'));
    await act(async () => {
      await result.current.handleChoosePhoto();
    });
    expect(result.current.imageError).not.toBeNull(); // Confirm error is set

    // 2. Call clearImageError
    act(() => {
      result.current.clearImageError();
    });

    // 3. Assert error is cleared
    expect(result.current.imageError).toBeNull();
  });
});