export interface Ticket {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalPrice: number;
  purchaseDate: string;
  qrCode: string;
}
