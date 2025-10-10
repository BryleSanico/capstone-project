export interface Ticket {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  qrCode: string;
}