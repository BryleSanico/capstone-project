export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  qrCode: string;
}