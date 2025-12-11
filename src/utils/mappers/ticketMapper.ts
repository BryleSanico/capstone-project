import { Ticket } from "../../types/ticket";

interface RawTicketData {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  total_price: number;
  purchase_date: string;
  qr_code: string;
}

export const ticketMapper = (item: RawTicketData): Ticket => {
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
