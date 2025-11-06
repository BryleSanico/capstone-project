import { Event } from "../../types/event";

/**
 * Maps a raw Supabase event row (from RPC or query) into the app's Event model.
 * Handles missing fields, organizer fallback, and naming consistency.
 */
export const eventMapper = (item: any): Event => {
  if (!item || typeof item !== "object") {
    console.warn("[eventMapper] Invalid item received:", item);
    throw new Error("Invalid event data received from Supabase.");
  }

  const organizerProfile =
    item.organizer ||
    item.event_organizers?.[0]?.profiles ||
    item.profiles ||
    null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    startTime: item.start_time,
    location: item.location,
    address: item.address,
    price: item.price,
    category: item.category,
    organizer: organizerProfile
      ? {
          id: organizerProfile.id,
          fullName: organizerProfile.fullName || organizerProfile.full_name,
          email: organizerProfile.email || "",
          avatar: organizerProfile.avatar || organizerProfile.avatar_url,
        }
      : {
          id: "00000000-0000-0000-0000-000000000000",
          fullName: "Community Event",
          email: "",
          avatar: undefined,
        },
    capacity: item.capacity,
    attendees: item.attendees ?? item.attendees_count ?? 0,
    tags: item.tags || [],
    updatedAt: item.updated_at,
    availableSlot: item.available_slot,
    userMaxTicketPurchase: item.user_max_ticket_purchase,
    isClosed: item.is_closed ?? false,
  };
};
