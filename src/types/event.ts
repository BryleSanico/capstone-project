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
  availableSlot: number;
  userMaxTicketPurchase: number;
}

// Represents the data captured by the Event form screen
export type EventFormData = {
  title: string;
  description: string;
  imageUrl: string; // Add if you have an image input
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  address: string;
  price: string; // Input is string, convert before sending
  category: string;
  capacity: string; // Input is string, convert before sending
  tags: string; // Comma-separated string for simplicity
  userMaxTicketPurchase: string; // Input is string
};