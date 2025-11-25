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
  createdAt?: string;
  updatedAt?: string;
  availableSlot: number;
  userMaxTicketPurchase: number;
  isClosed: boolean;
  isApproved: boolean
  isUpdate?: boolean;
}

// Represents the data captured by the Event form screen
export type EventFormData = {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  address: string;
  price: string;
  category: string;
  capacity: string;
  tags: string;
  userMaxTicketPurchase: string;
  isClosed: boolean;
  isApproved: boolean;
};