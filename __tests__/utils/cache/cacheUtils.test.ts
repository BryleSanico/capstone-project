import { mergeAndDedupeEvents } from "../../../src/utils/cache/cacheUtils";
import { Event } from "../../../src/types/event";
import { User } from "../../../src/types/user";

const mockUser: User = { id: "1", fullName: "Org", email: "org@test.com" };

const existingEvents: Event[] = [
  {
    id: 1,
    title: "Event 1",
    startTime: "2025-10-01T12:00:00Z",
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
    title: "Event 2 Old",
    startTime: "2025-10-02T12:00:00Z",
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

const newEvents: Event[] = [
  {
    id: 3,
    title: "Event 3 (New)",
    startTime: "2025-10-03T12:00:00Z",
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
    title: "Event 2 Updated",
    startTime: "2025-10-02T12:00:00Z",
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

describe("utils/cache/cacheUtils", () => {
  describe("mergeAndDedupeEvents", () => {
    const merged = mergeAndDedupeEvents(existingEvents, newEvents);

    it("should return the correct number of events (deduplicated)", () => {
      expect(merged).toHaveLength(3);
    });

    it("should add new events (Event 3)", () => {
      expect(merged.find((e) => e.id === 3)).toBeDefined();
    });

    it("should replace existing events with new ones (Event 2)", () => {
      const event2 = merged.find((e) => e.id === 2);
      expect(event2?.title).toBe("Event 2 Updated");
    });

    it("should sort the final list by startTime descending (most recent first)", () => {
      const ids = merged.map((e) => e.id);
      expect(ids).toEqual([3, 2, 1]); // Based on dates: Oct 3, Oct 2, Oct 1
    });

    it("should handle merging into an empty cache", () => {
      const merged = mergeAndDedupeEvents([], newEvents);
      expect(merged).toHaveLength(2);
      expect(merged.map((e) => e.id)).toEqual([3, 2]);
    });

    it("should handle merging an empty list", () => {
      const merged = mergeAndDedupeEvents(existingEvents, []);
      expect(merged).toHaveLength(2);
      expect(merged.map((e) => e.id)).toEqual([2, 1]);
    });
  });
});
