import { Image } from "react-native";

export const prefetchImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    // Pre-load the image into memory cache
    const result = await Image.prefetch(imageUrl);
    console.log(`[ImageCache] Prefetched ${imageUrl}: ${result}`);
  } catch (error) {
    console.error(`[ImageCache] Failed to prefetch ${imageUrl}:`, error);
  }
};

export const prefetchImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map((url) => prefetchImage(url)));
};
