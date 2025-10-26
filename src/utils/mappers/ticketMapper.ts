import { Ticket } from "../../types/ticket";

export const ticketMapper = (item: any): Ticket => {
  if (!item || typeof item !== "object") {
    console.warn("[eventMapper] Invalid item received:", item);
    throw new Error("Invalid event data received from Supabase.");
  }

  return {
    id: item.id,
    eventId: item.event_id,
    eventTitle: item.event_title,
    eventDate: item.event_date,
    eventTime: item.event_time,
    eventLocation: item.event_location,
    totalPrice: item.total_price,
    purchaseDate: item.purchase_date,
    qrCode: item.qr_code,
  };
};
