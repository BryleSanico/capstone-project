import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { act } from "@testing-library/react-native";
import { useEvents } from "../../src/stores/event-store";
import { eventService } from "../../src/services/eventService";
import { prefetchImages } from "../../src/utils/cache/imageCache";
// Import the cache service to mock it
import { cacheEventDetails } from "../../src/services/cache/eventCacheService";
import storageService from "../../src/services/storageService";
import { storageKeys } from "../../src/utils/cache/storageKeys";
import { Event } from "../../src/types/event";

// Mock all dependencies
jest.mock("../../src/services/eventService");
jest.mock("../../src/utils/cache/imageCache");
jest.mock("../../src/services/cache/eventCacheService");
jest.mock("../../src/services/storageService");

// Cast the imported mocks to their Jest types
const mockedEventService = eventService as jest.Mocked<typeof eventService>;
const mockedPrefetch = prefetchImages as jest.Mock<
  (urls: string[]) => Promise<void>
>;
const mockedCacheEventDetails = cacheEventDetails as jest.Mock;
const mockedStorageService = storageService as jest.Mocked<
  typeof storageService
>;

// Create a complete mock event
const mockEvent = (id: number, title: string, category: string): Event => ({
  id,
  title,
  category,
  description: "Mock event description",
  imageUrl: `http://image.url/${id}.jpg`,
  startTime: new Date(2025, 10, id).toISOString(),
  location: "Mock Location",
  address: "123 Mock St",
  price: 10 + id,
  organizer: { id: "org-1", fullName: "Mock Org", email: "org@test.com" },
  capacity: 100,
  attendees: 10,
  tags: ["mock", "test"],
  availableSlot: 90,
  userMaxTicketPurchase: 5,
});

// Mock data with correct page size (3)
const mockEventsPage1 = [
  mockEvent(1, "Event 1", "Music"),
  mockEvent(2, "Event 2", "Tech"),
  mockEvent(3, "Event 3", "Art"),
];
const mockEventsPage2 = [
  mockEvent(4, "Event 4", "Music"),
  mockEvent(5, "Event 5", "Food"),
];

const initialState = {
  _fullEventCache: [],
  displayedEvents: [],
  currentPage: 1,
  totalEvents: 0,
  isLoading: true,
  isSyncing: false,
  error: null,
  hasMore: true,
  currentEvent: null,
  categories: ["All"],
};

describe("stores/event-store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state before each test
    act(() => {
      useEvents.setState(initialState);
    });
  });

  it("loadInitialEvents should fetch and set first page", async () => {
    mockedEventService.getInitialEvents.mockResolvedValue({
      events: mockEventsPage1, // 3 events
      total: 10,
    });
    mockedPrefetch.mockResolvedValue(undefined);

    await act(async () => {
      await useEvents
        .getState()
        .loadInitialEvents({ query: "", category: "All" });
    });

    expect(mockedEventService.getInitialEvents).toHaveBeenCalled();
    expect(mockedPrefetch).toHaveBeenCalled();

    const state = useEvents.getState();
    expect(state.isLoading).toBe(false);
    expect(state._fullEventCache).toEqual(mockEventsPage1);
    expect(state.displayedEvents).toEqual(mockEventsPage1); // Page 1 = 3 events
    expect(state.totalEvents).toBe(10);
    expect(state.hasMore).toBe(true);
    expect(state.currentPage).toBe(1);
  });

  it("loadMoreEvents should load from local cache if available", async () => {
    // 1. Set up state with 5 events in cache, 3 displayed
    const fullCache = [...mockEventsPage1, ...mockEventsPage2]; // 5 events total
    act(() => {
      useEvents.setState({
        ...initialState, // Start from a known state
        _fullEventCache: fullCache,
        displayedEvents: mockEventsPage1, // Only page 1 (3 events)
        currentPage: 1,
        totalEvents: 5, // Total matches cache
        hasMore: true,
        isLoading: false,
      });
    });

    // 2. Call loadMoreEvents
    await act(async () => {
      await useEvents.getState().loadMoreEvents({ query: "", category: "All" });
    });

    // 3. Verify no network call
    expect(mockedEventService.getMoreEvents).not.toHaveBeenCalled();

    // 4. Verify state was updated from cache
    const state = useEvents.getState();
    expect(state.displayedEvents).toEqual(fullCache); // Now 5 events
    expect(state.currentPage).toBe(2);
    expect(state.hasMore).toBe(false); // 5 displayed, 5 total
  });

  it("loadMoreEvents should fetch from network if local cache is exhausted", async () => {
    // 1. Set up state where cache is exhausted
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: mockEventsPage1, // 3 events
        displayedEvents: mockEventsPage1,
        currentPage: 1,
        totalEvents: 5, // Has more, but cache is empty
        hasMore: true,
        isLoading: false,
      });
    });

    // 2. Mock network response
    const newFullCache = [...mockEventsPage1, ...mockEventsPage2]; // 5 events
    mockedEventService.getMoreEvents.mockResolvedValue({
      events: newFullCache,
      total: 5,
    });

    // 3. Call loadMoreEvents
    await act(async () => {
      await useEvents.getState().loadMoreEvents({ query: "", category: "All" });
    });

    // 4. Verify network call
    expect(mockedEventService.getMoreEvents).toHaveBeenCalled();

    // 5. Verify state
    const state = useEvents.getState();
    expect(state.isSyncing).toBe(false);
    expect(state._fullEventCache).toEqual(newFullCache);
    expect(state.displayedEvents).toEqual(newFullCache); // Page 1 + 2
    expect(state.currentPage).toBe(2);
    expect(state.hasMore).toBe(false); // 5 displayed, 5 total
  });

  it("decrementEventSlots should update event in all caches", () => {
    const eventToUpdate = mockEvent(1, "Event 1", "Music");
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: [eventToUpdate],
        displayedEvents: [eventToUpdate],
        currentEvent: eventToUpdate,
        isLoading: false,
      });
    });

    act(() => {
      useEvents.getState().decrementEventSlots(1, 2); // Buy 2 tickets
    });

    const state = useEvents.getState();
    const expected = { ...eventToUpdate, attendees: 12, availableSlot: 88 };

    expect(state._fullEventCache[0]).toEqual(expected);
    expect(state.displayedEvents[0]).toEqual(expected);
    expect(state.currentEvent).toEqual(expected);

    // Verify the (correctly mocked) function was called
    expect(mockedCacheEventDetails).toHaveBeenCalledWith([expected]);
  });

  it("refreshEvents should clear cache and fetch page 1", async () => {
    // 1. Set up a dirty state
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: mockEventsPage2,
        displayedEvents: mockEventsPage2,
        currentPage: 5,
        isLoading: false,
      });
    });

    // 2. Mock network response
    mockedEventService.refreshEventCache.mockResolvedValue({
      events: mockEventsPage1,
      total: 3,
    });

    // 3. Call refreshEvents
    await act(async () => {
      await useEvents.getState().refreshEvents({ query: "", category: "All" });
    });

    // 4. Verify state is reset
    const state = useEvents.getState();
    expect(mockedEventService.refreshEventCache).toHaveBeenCalled();
    expect(state.isSyncing).toBe(false);
    expect(state._fullEventCache).toEqual(mockEventsPage1);
    expect(state.displayedEvents).toEqual(mockEventsPage1);
    expect(state.currentPage).toBe(1);
    expect(state.totalEvents).toBe(3);
    expect(state.hasMore).toBe(false);
  });

  it("syncEvents should update cache and displayed items", async () => {
    // 1. Set up initial state (Page 1 displayed)
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: mockEventsPage1,
        displayedEvents: mockEventsPage1,
        totalEvents: 3,
        isLoading: false,
      });
    });

    // 2. Mock a sync response that updates one event and adds a new one
    const updatedEvent = mockEvent(1, "Event 1 Updated", "Music");
    const newEvent = mockEvent(10, "Brand New Event", "Tech");
    const syncedCache = [newEvent, updatedEvent, ...mockEventsPage1.slice(1)];

    mockedEventService.syncEventCache.mockResolvedValue(syncedCache);
    mockedStorageService.getItem.mockResolvedValue(4); // New total

    // 3. Call syncEvents
    await act(async () => {
      await useEvents.getState().syncEvents({ query: "", category: "All" });
    });

    // 4. Verify state
    const state = useEvents.getState();
    expect(state.isSyncing).toBe(false);
    expect(state._fullEventCache).toEqual(syncedCache);
    expect(state.totalEvents).toBe(4);

    // Crucially, displayedEvents should be the *same length* as before,
    // but contain the new data.
    expect(state.displayedEvents).toHaveLength(mockEventsPage1.length);
    expect(state.displayedEvents[0].title).toBe("Brand New Event");
    expect(state.displayedEvents[1].title).toBe("Event 1 Updated");
  });

  it("fetchEventById should set currentEvent on success", async () => {
    const event = mockEvent(1, "Event 1", "Music");
    mockedEventService.fetchEventById.mockResolvedValue(event);

    await act(async () => {
      await useEvents.getState().fetchEventById(1);
    });

    const state = useEvents.getState();
    expect(state.isLoading).toBe(false);
    expect(state.currentEvent).toEqual(event);
    expect(state.error).toBeNull();
  });

  it("fetchEventById should set error on failure", async () => {
    mockedEventService.fetchEventById.mockResolvedValue(null);

    await act(async () => {
      await useEvents.getState().fetchEventById(999);
    });

    const state = useEvents.getState();
    expect(state.isLoading).toBe(false);
    expect(state.currentEvent).toBeNull();
    expect(state.error).toBe("Event details could not be loaded.");
  });

  it("updateEventInCache should preserve organizer data", () => {
    // 1. Set up state with a fully-fleshed event
    const fullEvent = mockEvent(1, "Event 1", "Music");
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: [fullEvent],
        displayedEvents: [fullEvent],
        currentEvent: fullEvent,
        isLoading: false,
      });
    });

    // 2. A real-time update comes in with a placeholder organizer
    const partialUpdate = {
      ...mockEvent(1, "Event 1 Updated", "Music"),
      organizer: { id: "000-000", fullName: "Community Event", email: "" },
    };

    // 3. Call updateEventInCache
    act(() => {
      useEvents.getState().updateEventInCache(partialUpdate as Event);
    });

    // 4. Verify the title was updated BUT the organizer was preserved
    const state = useEvents.getState();
    expect(state.currentEvent?.title).toBe("Event 1 Updated");
    expect(state.currentEvent?.organizer.fullName).toBe("Mock Org");
  });

  it("categories should be calculated automatically when _fullEventCache changes", () => {
    // 1. Initial state
    expect(useEvents.getState().categories).toEqual(["All"]);

    // 2. Set the cache (triggers subscribe)
    act(() => {
      useEvents.setState({
        ...initialState,
        _fullEventCache: [
          mockEvent(1, "A", "Music"),
          mockEvent(2, "B", "Tech"),
          mockEvent(3, "C", "Music"), // duplicate
          mockEvent(4, "D", "Art"),
        ],
      });
    });

    // 3. Verify categories are updated, sorted, and de-duplicated
    expect(useEvents.getState().categories).toEqual([
      "All",
      "Art",
      "Music",
      "Tech",
    ]);
  });
});
