export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  category: string;
  organizer: string;
  capacity: number;
  attendees: number;
  tags: string[];
}

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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}