import { supabase } from "../../lib/supabase";
import { Event, EventFormData } from "../../types/event";
import { getCurrentSession } from "../../utils/system/sessionHelper";
import { eventMapper } from "../../utils/mappers/eventMapper";
import { Asset } from "react-native-image-picker";
import { toByteArray } from "react-native-quick-base64";
import { combineDateTime, parseTags } from "../../utils/domain/eventDataHelper";
import * as sqliteService from "../sqliteService";

const BUCKET_NAME = "event-images";

// Private Helper Functions

async function _uploadEventImage(
  asset: Asset,
  userId: string
): Promise<string> {
  if (!asset.base64 || !asset.fileName || !asset.type) {
    throw new Error(
      "Invalid image asset provided (missing base64, fileName, or type)."
    );
  }

  const filePath = `events/${userId}/${Date.now()}-${asset.fileName}`;
  const imageBytes = toByteArray(asset.base64);

  const { data, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, imageBytes, {
      contentType: asset.type ?? "image/jpeg",
      upsert: false,
      cacheControl: "604800",
    });

  if (uploadError) throw uploadError;
  if (!data) throw new Error("Upload succeeded but returned no path.");

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  if (!urlData || !urlData.publicUrl) {
    throw new Error("Image uploaded, but failed to get public URL.");
  }
  return urlData.publicUrl;
}

function _extractFilePath(imageUrl: string): string | null {
  const publicUrlBase = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = imageUrl.indexOf(publicUrlBase);
  if (index === -1) return null;
  return imageUrl.substring(index + publicUrlBase.length);
}

async function _deleteOldImage(oldImageUrl: string, newImagePath: string) {
  const oldPath = _extractFilePath(oldImageUrl);
  if (!oldPath || oldPath === newImagePath) {
    return; // Skip deletion
  }
  console.log(`[Storage Cleanup] Deleting old image: ${oldPath}`);
  await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
}

// Public API Functions

/**
 * Fetches all events organized by the current user.
 */
export async function getMyEvents(): Promise<Event[]> {
  const { data, error } = await supabase.rpc("get_user_organized_events");
  if (error) throw error;

  const serverEvents = data.map(eventMapper);

  // Insert to SQLite database
  await sqliteService.saveMyEvents(serverEvents);
  return serverEvents;
}

/**
 * Deletes a user's event.
 */
export async function deleteEvent(eventId: number): Promise<void> {
  const { error } = await supabase.rpc("delete_user_event", {
    p_event_id: eventId,
  });
  if (error) throw new Error(error.message);
}

/**
 * Creates a new event.
 */
export async function createEvent(
  formData: EventFormData,
  imageAsset: Asset | null
): Promise<Event> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");
  if (!imageAsset) throw new Error("Event image is required.");

  const imageUrl = await _uploadEventImage(imageAsset, userId);
  const startTime = combineDateTime(formData.date, formData.time);

  const { data, error } = await supabase.rpc("create_event", {
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
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Event creation returned no data.");
  }

  const newEvent = eventMapper(data[0]);

  await sqliteService.saveMyEvents([newEvent]);

  return newEvent;
}

/**
 * Updates an existing event.
 */
export async function updateEvent(
  eventId: number,
  formData: EventFormData,
  currentImageUrl: string,
  imageAsset: Asset | null,
  isClosed: boolean
): Promise<Event> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User must be logged in.");

  let imageUrl = currentImageUrl;
  let newImagePath = "";

  if (imageAsset) {
    try {
      imageUrl = await _uploadEventImage(imageAsset, userId);
      newImagePath = _extractFilePath(imageUrl) || "";
      await _deleteOldImage(currentImageUrl, newImagePath);
    } catch (uploadError: any) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }
  }

  const startTime = combineDateTime(formData.date, formData.time);
  const { data, error } = await supabase.rpc("update_user_event", {
    p_event_id: eventId,
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
    p_is_closed: isClosed,
    p_is_approved: false, // Mark as not approved on update
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Event update returned no data.");
  }

  // Update the data in SQLite database
  const updatedEvent = eventMapper(data[0]);
  await sqliteService.saveMyEvents([updatedEvent]);

  return updatedEvent;
}