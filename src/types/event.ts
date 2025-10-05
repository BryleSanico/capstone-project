export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startTime: string;
  location: string;
  address: string;
  price: number;
  category: string;
  organizer: string;
  capacity: number;
  attendees: number;
  tags: string[];
}