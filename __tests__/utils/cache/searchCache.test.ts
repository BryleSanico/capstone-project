import { searchCache } from "../../../src/utils/cache/searchCache";
import { Event } from "../../../src/types/event";
import { User } from "../../../src/types/user";

const mockUser: User = { id: "1", fullName: "Org", email: "org@test.com" };

const events: Event[] = [
  {
    id: 1,
    title: "Tech Conference 2025",
    description: "About React",
    location: "Main Hall",
    category: "Technology",
    tags: ["react", "code"],
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    imageUrl: "",
    startTime: "",
    userMaxTicketPurchase: 0,
    address: "",
  },
  {
    id: 2,
    title: "Music Fest",
    description: "Live bands",
    location: "Outdoor Stage",
    category: "Music",
    tags: ["live", "band"],
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    imageUrl: "",
    startTime: "",
    userMaxTicketPurchase: 0,
    address: "",
  },
  {
    id: 3,
    title: "Local Tech Meetup",
    description: "Networking event",
    location: "Cafe",
    category: "Technology",
    tags: ["community", "tech"],
    organizer: mockUser,
    price: 0,
    attendees: 0,
    availableSlot: 0,
    capacity: 0,
    imageUrl: "",
    startTime: "",
    userMaxTicketPurchase: 0,
    address: "",
  },
];

describe("utils/cache/searchCache", () => {
  it("should return all events if query is empty", () => {
    expect(searchCache(events, "")).toHaveLength(3);
    expect(searchCache(events, " ")).toHaveLength(3);
  });

  it("should be case-insensitive", () => {
    expect(searchCache(events, "tech")).toHaveLength(2);
    expect(searchCache(events, "TECH")).toHaveLength(2);
  });

  it("should find matches in title", () => {
    expect(searchCache(events, "Conference")).toHaveLength(1);
  });

  it("should find matches in description", () => {
    expect(searchCache(events, "React")).toHaveLength(1);
  });

  it("should find matches in location", () => {
    expect(searchCache(events, "Stage")).toHaveLength(1);
  });

  it("should find matches in category", () => {
    expect(searchCache(events, "Music")).toHaveLength(1);
  });

  it("should find matches in tags", () => {
    expect(searchCache(events, "band")).toHaveLength(1);
  });

  it("should require all tokens to match (AND search)", () => {
    const results = searchCache(events, "tech react");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it("should return an empty array if no events match", () => {
    expect(searchCache(events, "food")).toHaveLength(0);
  });
});
