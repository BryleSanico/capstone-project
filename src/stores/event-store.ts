import { create } from "zustand";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";
import { useNetworkStatus } from "../stores/network-store";

const EVENTS_PER_PAGE = 10;

type EventsState = {
  cachedEvents: Event[];
  currentPage: number;
  totalEvents: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  hasMore: boolean;
  categories: string[];
  currentEvent: Event | null;

  loadInitialEvents: (filters: {
    query: string;
    category: string;
  }) => Promise<void>;
  loadMoreEvents: (filters: {
    query: string;
    category: string;
  }) => Promise<void>;
  syncEvents: (filters: { query: string; category: string }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchEventById: (id: number) => Promise<void>;
  incrementAttendeeCount: (eventId: number, quantity: number) => void;
};

export const useEvents = create<EventsState>()((set, get) => ({
  cachedEvents: [],
  currentPage: 1,
  totalEvents: 0,
  isLoading: false,
  isSyncing: false,
  error: null,
  hasMore: true,
  categories: ["All"],
  currentEvent: null,

  loadInitialEvents: async ({ query, category }) => {
    set({
      isLoading: true,
      error: null,
      cachedEvents: [],
      currentPage: 1,
      hasMore: true,
    });

    const cached = await eventService.getCachedEvents();
    if (cached.length > 0) {
      set({ cachedEvents: cached, totalEvents: cached.length });
    }

    await get().syncEvents({ query, category });

    set({ isLoading: false });
  },

  loadMoreEvents: async ({ query, category }) => {
    const { isSyncing, hasMore, currentPage, cachedEvents } = get();
    if (isSyncing || !hasMore || !useNetworkStatus.getState().isConnected)
      return;

    set({ isSyncing: true });
    const nextPage = currentPage + 1;

    try {
      const { events: newEvents, totalCount } = await eventService.fetchEvents(
        nextPage,
        EVENTS_PER_PAGE,
        query,
        category,
        null
      );

      if (newEvents.length > 0) {
        const eventsMap = new Map(cachedEvents.map((e) => [e.id, e]));
        newEvents.forEach((event) => eventsMap.set(event.id, event));
        const mergedEvents = Array.from(eventsMap.values());

        await eventService.cacheEvents(mergedEvents);
        set({
          cachedEvents: mergedEvents,
          currentPage: nextPage,
          totalEvents: totalCount,
          hasMore: mergedEvents.length < totalCount,
        });
      } else {
        set({ hasMore: false });
      }
    } catch (err: any) {
      set({ error: "Could not load more events." });
    } finally {
      set({ isSyncing: false });
    }
  },

  syncEvents: async ({ query, category }) => {
    if (!useNetworkStatus.getState().isConnected) {
      set({ error: "You are offline. Please check your network connection." });
      return;
    }
    set({ isSyncing: true, error: null });

    try {
      const lastSyncTimestamp = await eventService.getLastSyncTimestamp();
      const { events: updatedEvents, totalCount } =
        await eventService.fetchEvents(
          1,
          EVENTS_PER_PAGE,
          query,
          category,
          lastSyncTimestamp
        );

      if (updatedEvents.length > 0 || get().cachedEvents.length === 0) {
        const existingCache = get().cachedEvents;
        const eventsMap = new Map(existingCache.map((e) => [e.id, e]));
        updatedEvents.forEach((event) => eventsMap.set(event.id, event));

        const mergedEvents = Array.from(eventsMap.values()).sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        await eventService.cacheEvents(mergedEvents);
        set({
          cachedEvents: mergedEvents,
          currentPage: 1,
          totalEvents: totalCount > 0 ? totalCount : mergedEvents.length,
          hasMore: mergedEvents.length < totalCount,
        });
      }

      const latestTimestamp = await eventService.getLatestEventTimestamp();
      if (latestTimestamp) {
        await eventService.setLastSyncTimestamp(latestTimestamp);
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      set({ error: "Failed to sync with the server." });
    } finally {
      set({ isSyncing: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await eventService.fetchCategories();
      set({ categories: [...new Set(data)] });
    } catch (err: any) {
      console.error("Failed to fetch categories:", err.message);
    }
  },

  fetchEventById: async (id: number) => {
    // Immediately check if the event is already in the main `cachedEvents` list for a fast response.
    const existingEvent = get().cachedEvents.find((e) => e.id === id);
    if (existingEvent) {
      set({ currentEvent: existingEvent, isLoading: false, error: null });
    } else {
      // Only show a full loader if the event is not available at all.
      set({ isLoading: true, error: null, currentEvent: null });
    }

    try {
      // Call the service
      const data = await eventService.fetchEventById(id);

      if (data) {
        set({ currentEvent: data });
      } else if (!existingEvent) {
        // Only set an error if the event couldn't be found anywhere (main cache or detail cache).
        set({ error: "Event details could not be loaded." });
      }
    } catch (err: any) {
      set({ error: "Failed to load event details." });
    } finally {
      // Ensure loading is always turned off after the process.
      set({ isLoading: false });
    }
  },

  incrementAttendeeCount: (eventId: number, quantity: number) => {
    set(state => {
      // Update the event in the main Discover list cache
      const updatedCachedEvents = state.cachedEvents.map(event => 
        event.id === eventId 
          ? { ...event, attendees: event.attendees + quantity, availableSlot: event.availableSlot - quantity } 
          : event
      );
      // Update the currently viewed event if it's the one being purchased
      const updatedCurrentEvent = state.currentEvent?.id === eventId
        ? { ...state.currentEvent, attendees: state.currentEvent.attendees + quantity, availableSlot: state.currentEvent.availableSlot - quantity }
        : state.currentEvent;
      
      // Persist the updated event list to the device storage
      eventService.cacheEvents(updatedCachedEvents);
      
      return {
        cachedEvents: updatedCachedEvents,
        currentEvent: updatedCurrentEvent
      };
    });
  }
}));
