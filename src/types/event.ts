import { User } from "../types/user";

export interface Event {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  startTime: string;
  location: string;
  address: string;
  price: number;
  category: string;
  organizer: User;
  capacity: number;
  attendees: number;
  tags: string[];
  updatedAt?: string;
}