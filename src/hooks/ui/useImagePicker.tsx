import { useState } from "react";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import {
  validateFileType,
  validateFileSize,
  hasBase64Data,
} from "../../utils/validations/validation";
import { checkAndRequestPhotoPermission } from "../../utils/validations/permissions";
import { logger } from "../../utils/system/logger";

const MAX_FILE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

/**
 * A custom hook to encapsulate all logic for picking and validating an event image.
 */
export const useImagePicker = () => {
  const [imageAsset, setImageAsset] = useState<Asset | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const displayImageUri = imageAsset?.uri || currentImageUrl;

  const clearImageError = () => {
    setImageError(null);
  };

  const handleChoosePhoto = async () => {
    setImageError(null);

    try {
      const hasPermission = await checkAndRequestPhotoPermission();
      if (!hasPermission) {
        logger.info("[useImagePicker] Permission denied by user.");
        return;
      }
    } catch (error) {
      logger.error("[useImagePicker] Permission check failed:", error);
      setImageError("A problem occurred while checking permissions.");
      return;
    }

    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.5,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          logger.info("User cancelled image picker");
          return;
        }
        if (response.errorCode) {
          logger.error("ImagePicker Error: ", response.errorMessage);
          if (response.errorCode === "permission") {
            setImageError(
              "Cannot access photos. Please enable permission in settings."
            );
          } else {
            setImageError(response.errorMessage || "Could not select image.");
          }
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];

          // Type guard: ensure asset exists
          if (!asset) {
            setImageError("Could not read image asset.");
            return;
          }

          // Use validation utils
          if (!validateFileType(asset.type, ALLOWED_IMAGE_TYPES)) {
            setImageError("Invalid file type. Please select a JPG or PNG.");
            return;
          }
          if (!validateFileSize(asset.fileSize, MAX_FILE_SIZE_MB)) {
            setImageError(
              `Image is too large. Max file size is ${MAX_FILE_SIZE_MB}MB.`
            );
            return;
          }
          if (!hasBase64Data(asset.base64)) {
            setImageError("Could not read image data (base64 missing).");
            return;
          }

          setImageAsset(asset);
          logger.info("Image selected (base64 included):", asset.fileName);
        }
      }
    );
  };

  return {
    imageAsset,
    currentImageUrl,
    setCurrentImageUrl,
    displayImageUri,
    handleChoosePhoto,
    imageError,
    clearImageError,
  };
};