import { supabase } from "../lib/supabase";
import { Event, EventFormData } from "../types/event";
import { getCurrentSession } from "../helpers/sessionHelper";
import storageService from "./storageService";
import { storageKeys } from "../utils/storageKeys";
import { useNetworkStatus } from "../stores/network-store";
import { eventMapper } from "../utils/mappers/eventMapper";
import { Asset } from "react-native-image-picker";
import { toByteArray } from "react-native-quick-base64";
import { combineDateTime, parseTags } from "../helpers/eventDataHelper";
import { withRetry } from "../utils/networkUtils";

const CACHE_EXPIRATION_DURATION = 1 * 60 * 60 * 1000; // 1 hour
const BUCKET_NAME = "event-images";

type CachedMyEvents = {
  events: Event[];
  lastUpdatedAt: number;
};

// Helper to Hydrate Organizer from Session
async function _getCurrentOrganizerData() {
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.user_metadata?.full_name || user.email || "Organizer",
    email: user.email || "",
    avatar: user.user_metadata?.avatar_url || undefined,
  };
}

// Invalidate all relevant caches
async function invalidateCaches(userId?: string) {
  try {
    console.log("[invalidateCaches] Starting 'My Events' cache invalidation...");
    if (userId) {
      await storageService.removeItem(storageKeys.getMyEventsCacheKey(userId));
      console.log("[invalidateCaches] Removed myEvents cache.");
    }
    console.log("[invalidateCaches] Finished 'My Events' invalidation.");
  } catch (error) {
    console.error("[invalidateCaches] Error during cache invalidation:", error);
  }
}

// Helper to Delete Old Image
function _extractFilePath(imageUrl: string): string | null {
  // The path starts *after* the public URL base segments
  const publicUrlBase = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = imageUrl.indexOf(publicUrlBase);

  if (index === -1) {
    return null; // Not a Supabase URL
  }

  // Return the path relative to the bucket (e.g., events/user_id/filename.jpg)
  return imageUrl.substring(index + publicUrlBase.length);
}

async function _deleteOldImage(oldImageUrl: string, newImagePath: string) {
  const oldPath = _extractFilePath(oldImageUrl);
  if (!oldPath) {
    console.log(
      `[Storage Cleanup] Old URL is not a recognizable Supabase path. Skipping deletion.`
    );
    return;
  }

  // If the new file path is the same as the old path, skip deletion.
  if (oldPath === newImagePath) {
    console.log(
      `[Storage Cleanup] New path is identical to old path. Skipping deletion.`
    );
    return;
  }

  console.log(
    `[Storage Cleanup] Attempting to delete old image at path: ${oldPath}`
  );

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([oldPath]);

  if (error) {
    console.error(
      `[Storage Cleanup] FAILED to delete old image ${oldPath}. Error:`,
      error
    );
  } else {
    console.log(`[Storage Cleanup] SUCCESS: Deleted old image at: ${oldPath}`);
  }
}

//  Upload Helper (Using Base64)
async function _uploadEventImage(
  asset: Asset,
  userId: string
): Promise<string> {
  // Check for base64 instead of uri
  if (!asset.base64 || !asset.fileName || !asset.type) {
    throw new Error(
      "Invalid image asset provided (missing base64, fileName, or type)."
    );
  }

  const fileExt = asset.fileName.split(".").pop() ?? "jpg";
  const filePath = `events/${userId}/${Date.now()}-${asset.fileName}`;
  console.log(`[Upload] Attempting to upload to: ${filePath} (from base64)`);

  try {
    // Decode base64 to Uint8Array
    const imageBytes = toByteArray(asset.base64);
    console.log(
      `[Upload] Decoded base64 to Uint8Array (Size: ${imageBytes.length} bytes)`
    );

    // Upload the byte array to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBytes, {
        // Pass the byte array
        contentType: asset.type ?? "image/jpeg",
        upsert: false,
        cacheControl: "604800", // 7 days
      });

    if (uploadError) {
      console.error("[Upload] Supabase Storage Error:", uploadError);
      // Check for specific RLS error during upload
      if (
        uploadError.message.includes("security policy") ||
        uploadError.message.includes("Row level security")
      ) {
        throw new Error(
          `Failed to upload image: RLS policy violation. Check Storage policies.`
        );
      }
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    if (!data) {
      throw new Error("Upload succeeded but returned no path information.");
    }

    console.log("[Upload] Upload successful:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      console.error("[Upload] Failed to get public URL for path:", data.path);
      throw new Error("Image uploaded, but failed to get public URL.");
    }

    console.log("[Upload] Public URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error(
      "[_uploadEventImage] Error during processing or upload:",
      error
    );
    // Re-throw the specific error message
    throw new Error(
      error.message || "An unknown error occurred during image upload."
    );
  }
}
//  END UPLOAD HELPER

/**
 * [PRIVATE] Fetches all events for the user from the server RPC.
 */
async function _fetchMyEvents(): Promise<Event[]> {
  const { data, error } = await supabase.rpc("get_user_organized_events");
  if (error) {
    throw error;
  }
  return data.map(eventMapper);
}

/**
 * [PUBLIC] Gets user's organized events, applying cache-first logic.
 */
async function getMyEvents(): Promise<Event[]> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return [];
  const cacheKey = storageKeys.getMyEventsCacheKey(userId);
  const cachedData = await storageService.getItem<CachedMyEvents>(cacheKey);
  const isCacheExpired =
    !cachedData ||
    Date.now() - cachedData.lastUpdatedAt > CACHE_EXPIRATION_DURATION;

  if (cachedData && !isCacheExpired) {
    return cachedData.events;
  }
  if (useNetworkStatus.getState().isConnected) {
    try {
      const serverEvents = await _fetchMyEvents();
      await storageService.setItem(cacheKey, {
        events: serverEvents,
        lastUpdatedAt: Date.now(),
      });
      return serverEvents;
    } catch (error) {
      return cachedData?.events || [];
    }
  }
  return cachedData?.events || [];
}

/**
 * [PUBLIC] Deletes a user's event.
 */
async function deleteEvent(eventId: number): Promise<void> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");
  const { error } = await withRetry(() =>
  supabase.rpc("delete_user_event", {
    p_event_id: eventId,
  }));
  if (error) {
    throw new Error(error.message);
  }
  await invalidateCaches(userId);
}

//  CREATE EVENT METHOD
// Accepts formData (without imageUrl) and optional imageAsset
async function createEvent(
  formData: EventFormData,
  imageAsset?: Asset | null
): Promise<Event> {
  console.log("[createEvent] Service called with formData:", formData);
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User must be logged in.");
  }

  let imageUrl = "https://placehold.co/600x400/EEE/31343C?text=Event+Image";
  if (imageAsset) {
    // Calls the updated base64 upload helper
    imageUrl = await _uploadEventImage(imageAsset, userId);
  }

  const startTime = combineDateTime(formData.date, formData.time);
  if (!startTime) throw new Error("Invalid Date or Time format.");

  const params = {
    p_title: formData.title,
    p_description: formData.description,
    p_image_url: imageUrl,
    p_start_time: startTime,
    p_location: formData.location,
    p_address: formData.address || "",
    p_price: parseFloat(formData.price) || 0,
    p_category: formData.category,
    p_capacity: parseInt(formData.capacity, 10) || 0,
    p_tags: parseTags(formData.tags),
    p_user_max_ticket_purchase:
      parseInt(formData.userMaxTicketPurchase, 10) || 10,
  };

  let data: any;
  let error: any;
  try {
    const response = await withRetry(() =>
    supabase.rpc("create_event", params));
    data = response.data;
    error = response.error;
  } catch (rpcError: any) {
    throw rpcError;
  }
  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("Event creation returned no data.");
  }

  await invalidateCaches(userId);
  try {
    return eventMapper(data[0]);
  } catch (mapError: any) {
    throw mapError;
  }
}

//  UPDATE EVENT METHOD
async function updateEvent(
  eventId: number,
  formData: EventFormData,
  currentImageUrl: string, // URL currently in the database
  imageAsset?: Asset | null
): Promise<Event> {
  console.log(`[updateEvent] Service called for event ${eventId}`);

  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User must be logged in.");
  }

  let imageUrl = currentImageUrl; // Default: keep the old URL
  let newImagePath = "";

  if (imageAsset) {
    console.log(`[updateEvent] Uploading new image for event ${eventId}...`);
    try {
      // UPLOAD NEW FILE
      imageUrl = await _uploadEventImage(imageAsset, userId);
      console.log(`[updateEvent] New image uploaded successfully: ${imageUrl}`);

      // Extract the path of the newly uploaded file from the new URL
      newImagePath = _extractFilePath(imageUrl) || "";

      // DELETE OLD FILE
      // Only delete if there was a previous image
      if (currentImageUrl) {
        console.log(
          `[updateEvent] Deleting old event image: ${currentImageUrl}`
        );

        // await the deletion, wrap in try/catch so a failed
        // delete doesn't stop the whole update.
        try {
          await _deleteOldImage(currentImageUrl, newImagePath);
        } catch (deleteError: any) {
          // Log the non-critical error and continue
          console.error(
            `[updateEvent] Failed to delete old image, but continuing update. Error: ${deleteError.message}`
          );
        }
      }
    } catch (uploadError: any) {
      // If the upload fails, stop the whole process.
      console.error(
        `[updateEvent] Image upload failed. Aborting update. Error: ${uploadError.message}`
      );
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }
  }

  // UPDATE DATABASE
  console.log(
    `[updateEvent] Calling RPC to update event ${eventId} with image URL: ${imageUrl}`
  );
  const startTime = combineDateTime(formData.date, formData.time);
  if (!startTime) throw new Error("Invalid Date or Time format.");

  const { data, error } = await withRetry(() =>
  supabase.rpc("update_user_event", {
    p_event_id: eventId,
    p_title: formData.title,
    p_description: formData.description,
    p_image_url: imageUrl, // Use the new uploaded URL or the old one
    p_start_time: startTime,
    p_location: formData.location,
    p_address: formData.address || "",
    p_price: parseFloat(formData.price) || 0,
    p_category: formData.category,
    p_capacity: parseInt(formData.capacity, 10) || 0,
    p_tags: parseTags(formData.tags),
    p_user_max_ticket_purchase:
      parseInt(formData.userMaxTicketPurchase, 10) || 10,
  }));

  if (error) {
    console.error(`[updateEvent] RPC Error:`, error);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    console.warn(`[updateEvent] RPC returned no data for event ${eventId}.`);
    throw new Error("Event update returned no data.");
  }

  console.log(`[updateEvent] Event ${eventId} updated successfully in DB.`);
  await invalidateCaches(userId);

  // HYDRATE ORGANIZER DATA AND RETURN
  try {
    let updatedEvent = eventMapper(data[0]);

    const organizerData = await _getCurrentOrganizerData();
    if (organizerData) {
      updatedEvent.organizer = organizerData;
    }

    return updatedEvent;
  } catch (mapError: any) {
    console.error(
      `[updateEvent] Failed to map event data after update:`,
      mapError
    );
    throw mapError;
  }
}

// Export the public-facing service object
export const myEventsService = {
  getMyEvents,
  deleteEvent,
  updateEvent,
  createEvent,
};
