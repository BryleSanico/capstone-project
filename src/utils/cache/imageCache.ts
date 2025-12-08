import { Image } from "react-native";
import { logger } from "../system/logger";

export const prefetchImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    // Pre-load the image into memory cache
    const result = await Image.prefetch(imageUrl);
    logger.info(`[ImageCache] Prefetched ${imageUrl}: ${result}`);
  } catch (error) {
    logger.error(`[ImageCache] Failed to prefetch ${imageUrl}:`, error);
  }
};

export const prefetchImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map((url) => prefetchImage(url)));
};

