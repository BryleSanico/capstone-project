import {
  filterEventsByDate,
  filterTicketsByDate,
} from "../../../src/utils/domain/filterUtils";
import { Event } from "../../../src/types/event";
import { Ticket } from "../../../src/types/ticket";
import { User } from "../../../src/types/user";

const mockUser: User = { id: "1", fullName: "Org", email: "org@test.com" };

const events: Event[] = [
  {
    id: 1,
    title: "Past Event",
    startTime: "2025-01-01T12:00:00Z",
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    category: "",
    description: "",
    imageUrl: "",
    location: "",
    tags: [],
    userMaxTicketPurchase: 0,
    address: "",
  },
  {
    id: 2,
    title: "Upcoming Event 1",
    startTime: "2025-02-02T12:00:00Z",
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    category: "",
    description: "",
    imageUrl: "",
    location: "",
    tags: [],
    userMaxTicketPurchase: 0,
    address: "",
  },
  {
    id: 3,
    title: "Upcoming Event 2",
    startTime: "2025-02-01T12:00:00Z",
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    category: "",
    description: "",
    imageUrl: "",
    location: "",
    tags: [],
    userMaxTicketPurchase: 0,
    address: "",
  },
  {
    id: 4,
    title: "Invalid Date Event",
    startTime: "invalid-date",
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    category: "",
    description: "",
    imageUrl: "",
    location: "",
    tags: [],
    userMaxTicketPurchase: 0,
    address: "",
  },
];

const tickets: Ticket[] = [
  {
    id: 1,
    eventTitle: "Past Ticket",
    eventDate: "2025-01-01T12:00:00Z",
    eventTime: "",
    eventLocation: "",
    eventId: 1,
    purchaseDate: "",
    qrCode: "",
    totalPrice: 0,
  },
  {
    id: 2,
    eventTitle: "Upcoming Ticket 1",
    eventDate: "2025-02-02T12:00:00Z",
    eventTime: "",
    eventLocation: "",
    eventId: 2,
    purchaseDate: "",
    qrCode: "",
    totalPrice: 0,
  },
  {
    id: 3,
    eventTitle: "Upcoming Ticket 2",
    eventDate: "2025-02-01T12:00:00Z",
    eventTime: "",
    eventLocation: "",
    eventId: 3,
    purchaseDate: "",
    qrCode: "",
    totalPrice: 0,
  },
];

// Set a fixed "now" timestamp for all tests
const now = new Date("2025-01-31T12:00:00Z").getTime();

describe("utils/domain/filterUtils", () => {
  describe("filterEventsByDate", () => {
    const { upcoming, past } = filterEventsByDate(events, now);

    it("should correctly partition events into upcoming and past", () => {
      expect(upcoming).toHaveLength(2);
      expect(past).toHaveLength(2);
      expect(upcoming.map((e) => e.id)).toEqual([3, 2]); // Upcoming Event 2, then 1
      expect(past.map((e) => e.id)).toEqual([1, 4]); // Past Event, then Invalid
    });

    it("should sort upcoming events in ascending order (soonest first)", () => {
      expect(upcoming[0].title).toBe("Upcoming Event 2");
      expect(upcoming[1].title).toBe("Upcoming Event 1");
    });

    it("should sort past events in descending order (most recent first)", () => {
      expect(past[0].title).toBe("Past Event");
      expect(past[1].title).toBe("Invalid Date Event"); // Invalid dates get timestamp 0, sorted last
    });
  });

  describe("filterTicketsByDate", () => {
    const { upcoming, past } = filterTicketsByDate(tickets, now);

    it("should correctly partition tickets into upcoming and past", () => {
      expect(upcoming).toHaveLength(2);
      expect(past).toHaveLength(1);
    });

    it("should sort upcoming tickets in ascending order (soonest first)", () => {
      expect(upcoming[0].eventTitle).toBe("Upcoming Ticket 2");
      expect(upcoming[1].eventTitle).toBe("Upcoming Ticket 1");
    });
  });
});
