import { Event } from "../../types/event";

/**
 * Maps a raw Supabase event row (from RPC or query) into the app's Event model.
 * Handles missing fields, organizer fallback, and naming consistency.
 */
export const eventMapper = (item: Record<string, unknown>): Event => {
  if (!item || typeof item !== "object") {
    console.warn("[eventMapper] Invalid item received:", item);
    throw new Error("Invalid event data received from Supabase.");
  }

  const organizerProfile =
    item.organizer ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item.event_organizers as any)?.[0]?.profiles ??
    item.profiles ??
    null;

  return {
    id: item.id as number,
    title: item.title as string,
    description: item.description as string,
    imageUrl: item.image_url as string,
    startTime: item.start_time as string,
    location: item.location as string,
    address: item.address as string,
    price: item.price as number,
    category: item.category as string,
    organizer: organizerProfile
      ? {
          id: organizerProfile.id,
          fullName: organizerProfile.fullName ?? organizerProfile.full_name,
          email: organizerProfile.email ?? "",
          avatar: organizerProfile.avatar ?? organizerProfile.avatar_url,
        }
      : {
          id: "00000000-0000-0000-0000-000000000000",
          fullName: "Community Event",
          email: "",
          avatar: undefined,
        },
    capacity: item.capacity as number,
    attendees: (item.attendees ?? item.attendees_count ?? 0) as number,
    tags: (item.tags ?? []) as string[],
    updatedAt: item.updated_at as string,
    availableSlot: item.available_slot as number,
    userMaxTicketPurchase: item.user_max_ticket_purchase as number,
    isClosed: (item.is_closed ?? false) as boolean,
    isApproved: (item.is_approved ?? false) as boolean,
    isUpdate: (item.is_update ?? false) as boolean,
  };
};
