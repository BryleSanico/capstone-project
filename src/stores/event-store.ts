import { create } from "zustand";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";
import { useNetworkStatus } from "../stores/network-store";

const EVENTS_PER_PAGE = 2;

type EventsState = {
  // This holds the full list of all events ever loaded/synced.
  _fullEventCache: Event[];
  // This holds only the events currently visible in the FlatList.
  displayedEvents: Event[];
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
  decrementEventSlots: (eventId: number, quantity: number) => void;
  updateEventInCache: (updatedEvent: Event) => void;
};

export const useEvents = create<EventsState>()((set, get) => ({
  _fullEventCache: [],
  displayedEvents: [],
  currentPage: 1,
  totalEvents: 0,
  isLoading: false,
  isSyncing: false,
  error: null,
  hasMore: true,
  categories: ["All"],
  currentEvent: null,

  loadInitialEvents: async (filters) => {
    set({ isLoading: true, error: null, currentPage: 1 });

    const fullCache = await eventService.getCachedEvents();

    if (fullCache.length > 0) {
      set({
        _fullEventCache: fullCache,
        displayedEvents: fullCache.slice(0, EVENTS_PER_PAGE),
        totalEvents: fullCache.length,
        hasMore: fullCache.length > EVENTS_PER_PAGE,
        isLoading: false,
      });
      get().syncEvents(filters); // Sync in background
    } else {
      await get().syncEvents(filters); // Sync and show loader
      set({ isLoading: false });
    }
  },

  loadMoreEvents: async () => {
    const {
      isSyncing,
      hasMore,
      currentPage,
      _fullEventCache,
      displayedEvents,
    } = get();
    if (isSyncing || !hasMore) return;

    const nextPage = currentPage + 1;
    const nextEventsOffset = currentPage * EVENTS_PER_PAGE;

    // First, try to load more from the full local cache
    if (nextEventsOffset < _fullEventCache.length) {
      const nextBatch = _fullEventCache.slice(
        nextEventsOffset,
        nextEventsOffset + EVENTS_PER_PAGE
      );
      set({
        displayedEvents: [...displayedEvents, ...nextBatch],
        currentPage: nextPage,
        hasMore: nextEventsOffset + EVENTS_PER_PAGE < _fullEventCache.length,
      });
      return;
    }

    // If local cache is exhausted, fetch from network
    if (!useNetworkStatus.getState().isConnected) return;

    set({ isSyncing: true });
    try {
      const { events: newEvents, totalCount } = await eventService.fetchEvents(
        nextPage,
        EVENTS_PER_PAGE,
        "",
        "All",
        null
      );

      if (newEvents.length > 0) {
        const updatedFullCache = [..._fullEventCache, ...newEvents];
        await eventService.cacheEvents(updatedFullCache);
        set({
          _fullEventCache: updatedFullCache,
          displayedEvents: [...displayedEvents, ...newEvents],
          currentPage: nextPage,
          totalEvents: totalCount,
          hasMore: updatedFullCache.length < totalCount,
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

  syncEvents: async (filters) => {
    if (!useNetworkStatus.getState().isConnected) {
      set({ error: "You are offline." });
      return;
    }
    set({ isSyncing: true, error: null });

    try {
      const localTimestamp = await eventService.getLastSyncTimestamp();
      const serverTimestamp = await eventService.getLatestEventTimestamp();

      if (
        localTimestamp &&
        serverTimestamp &&
        localTimestamp >= serverTimestamp
      ) {
        set({ isSyncing: false });
        return; // Cache is up-to-date
      }

      // Fetch all updates since last sync, or all events if no cache exists
      const { events: fetchedEvents, totalCount } =
        await eventService.fetchEvents(
          null,
          null,
          filters.query,
          filters.category,
          localTimestamp
        );

      const fullCache = await eventService.getCachedEvents();
      const eventsMap = new Map(fullCache.map((e) => [e.id, e]));
      fetchedEvents.forEach((event) => eventsMap.set(event.id, event));

      const mergedEvents = Array.from(eventsMap.values()).sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      await eventService.cacheEvents(mergedEvents);

      set({
        _fullEventCache: mergedEvents,
        displayedEvents: mergedEvents.slice(0, EVENTS_PER_PAGE),
        currentPage: 1,
        totalEvents: totalCount > 0 ? totalCount : mergedEvents.length,
        hasMore: mergedEvents.length > EVENTS_PER_PAGE,
      });

      if (serverTimestamp) {
        await eventService.setLastSyncTimestamp(serverTimestamp);
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
    const existingEvent = get()._fullEventCache.find((e) => e.id === id);
    if (existingEvent) {
      set({ currentEvent: existingEvent, isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null, currentEvent: null });
    try {
      const data = await eventService.fetchEventById(id);
      if (data) {
        set({ currentEvent: data });
      } else {
        set({ error: "Event details could not be loaded." });
      }
    } catch (err: any) {
      set({ error: "Failed to load event details." });
    } finally {
      set({ isLoading: false });
    }
  },

  decrementEventSlots: (eventId: number, quantity: number) => {
    set((state) => {
      const updateFn = (event: Event) =>
        event.id === eventId
          ? {
              ...event,
              attendees: event.attendees + quantity,
              availableSlot: event.availableSlot - quantity,
            }
          : event;

      const updatedFullCache = state._fullEventCache.map(updateFn);
      const updatedDisplayedEvents = state.displayedEvents.map(updateFn);
      const updatedCurrentEvent =
        state.currentEvent?.id === eventId
          ? updateFn(state.currentEvent)
          : state.currentEvent;

      eventService.cacheEvents(updatedFullCache);

      return {
        _fullEventCache: updatedFullCache,
        displayedEvents: updatedDisplayedEvents,
        currentEvent: updatedCurrentEvent,
      };
    });
  },

  updateEventInCache: (updatedEvent: Event) => {
    set((state) => {
      const updateFn = (event: Event) =>
        event.id === updatedEvent.id ? updatedEvent : event;

      const updatedFullCache = state._fullEventCache.map(updateFn);
      const updatedDisplayedEvents = state.displayedEvents.map(updateFn);
      const updatedCurrentEvent =
        state.currentEvent?.id === updatedEvent.id
          ? updatedEvent
          : state.currentEvent;

      eventService.cacheEvents(updatedFullCache);
      eventService.cacheEventDetails([updatedEvent]);

      return {
        _fullEventCache: updatedFullCache,
        displayedEvents: updatedDisplayedEvents,
        currentEvent: updatedCurrentEvent,
      };
    });
  },
}));
