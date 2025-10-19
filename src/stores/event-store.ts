// filename: src/stores/event-store.ts
import { create } from "zustand";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";
import { useNetworkStatus } from "../stores/network-store";
import { mergeAndDedupeEvents } from "../utils/cacheUtils";

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
  refreshEvents: (filters: {
    query: string;
    category: string;
  }) => Promise<void>;
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

  refreshEvents: async (filters) => {
    if (!useNetworkStatus.getState().isConnected) {
      console.log("[Refresh] Cannot refresh while offline.");
      set({ error: "You are offline." });
      return;
    }

    set({ isSyncing: true, error: null });
    try {
      // Clear all the cached data first.
      await eventService.clearCachedEvents();
      await eventService.clearCachedEventDetails();
      console.log("[Refresh] Cleared event caches.");

      // After clearing, call loadInitialEvents which will fetch from the network
      // as it will find no cache. It also resets the UI state correctly.
      await get().loadInitialEvents(filters);
    } catch (err) {
      console.error("Refresh failed:", err);
      set({ error: "Failed to refresh events." });
    } finally {
      // Ensure the RefreshControl spinner is turned off
      set({ isSyncing: false });
    }
  },

  loadInitialEvents: async (filters) => {
    set({
      isLoading: true,
      error: null,
      currentPage: 1,
      displayedEvents: [],
      _fullEventCache: [],
    });

    const cachedEvents = await eventService.getCachedEvents();

    if (cachedEvents.length > 0) {
      const firstPage = cachedEvents.slice(0, EVENTS_PER_PAGE);
      console.log(
        `[Initial Load] Loaded ${cachedEvents.length} events from cache. Displaying ${firstPage.length}.`
      );

      set({
        _fullEventCache: cachedEvents,
        displayedEvents: firstPage,
        currentPage: 1,
        // Correctly determine if more pages exist in the cache.
        hasMore: firstPage.length < cachedEvents.length,
        isLoading: false,
      });
    } else {
      if (!useNetworkStatus.getState().isConnected) {
        set({ error: "You are offline.", isLoading: false });
        return;
      }

      set({ isSyncing: true });
      try {
        const { events: firstPageEvents, totalCount } =
          await eventService.fetchEvents(
            1,
            EVENTS_PER_PAGE,
            filters.query,
            filters.category,
            null
          );

        console.log(
          `[Initial Load] No cache. Fetched ${firstPageEvents.length} initial events from server.`
        );
        await eventService.cacheEvents(firstPageEvents);

        set({
          _fullEventCache: firstPageEvents,
          displayedEvents: firstPageEvents,
          currentPage: 1,
          totalEvents: totalCount,
          hasMore: firstPageEvents.length < totalCount,
        });
      } catch (err: any) {
        set({ error: "Could not load events." });
      } finally {
        set({ isLoading: false, isSyncing: false });
      }
    }
  },

  loadMoreEvents: async (filters) => {
    const {
      isLoading,
      isSyncing,
      hasMore,
      currentPage,
      _fullEventCache,
      displayedEvents,
    } = get();
    if (isLoading || isSyncing || !hasMore) return;

    const isConnected = useNetworkStatus.getState().isConnected;

    // --- OFFLINE PAGINATION LOGIC ---
    if (!isConnected) {
      console.log("[Load More] Offline mode. Trying to load from cache.");
      const nextOffset = currentPage * EVENTS_PER_PAGE;

      if (nextOffset < _fullEventCache.length) {
        const nextBatch = _fullEventCache.slice(
          nextOffset,
          nextOffset + EVENTS_PER_PAGE
        );
        console.log(
          `[Load More] Loaded ${nextBatch.length} more events from cache.`
        );
        set({
          displayedEvents: [...displayedEvents, ...nextBatch],
          currentPage: currentPage + 1,
          hasMore: nextOffset + nextBatch.length < _fullEventCache.length,
        });
      } else {
        console.log("[Load More] No more events in cache to display.");
        set({ hasMore: false });
      }
      return;
    }

    // --- ONLINE FETCH LOGIC ---
    set({ isSyncing: true });
    try {
      const nextPage = currentPage + 1;
      const { events: newEvents, totalCount } = await eventService.fetchEvents(
        nextPage,
        EVENTS_PER_PAGE,
        filters.query,
        filters.category,
        null
      );

      if (newEvents.length > 0) {
        const updatedFullCache = mergeAndDedupeEvents(get()._fullEventCache, newEvents);
        const newDisplayedEvents = [...displayedEvents, ...newEvents.filter(e => !displayedEvents.some(de => de.id === e.id))];

        console.log(
          `[Load More] Fetched ${newEvents.length} new events. Total displayed: ${newDisplayedEvents.length}.`
        );
        
        await eventService.cacheEvents(updatedFullCache);

        set({
          _fullEventCache: updatedFullCache,
          displayedEvents: newDisplayedEvents,
          currentPage: nextPage,
          totalEvents: totalCount,
          // Correctly compare the new displayed count to the server total.
          hasMore: newDisplayedEvents.length < totalCount,
        });
      } else {
        console.log("[Load More] No more events to fetch from server.");
        set({ hasMore: false, totalEvents: totalCount });
      }
    } catch (err: any) {
      set({ error: "Could not load more events." });
    } finally {
      set({ isSyncing: false });
    }
  },

  syncEvents: async (filters) => {
    if (!useNetworkStatus.getState().isConnected || get().isSyncing) {
      return;
    }
    set({ isSyncing: true, error: null });

    try {
      const localTimestamp = await eventService.getLastSyncTimestamp();
      const serverTimestamp = await eventService.getLatestEventTimestamp();

      if (
        serverTimestamp &&
        localTimestamp &&
        new Date(localTimestamp) >= new Date(serverTimestamp)
      ) {
        console.log("[Sync] Local data is already up-to-date.");
        set({ isSyncing: false, hasMore: true });
        return;
      }

      const { events: updatedEvents, totalCount } =
        await eventService.fetchEvents(
          null,
          null,
          filters.query,
          filters.category,
          localTimestamp
        );

      if (updatedEvents.length > 0) {
        console.log(
          `[Sync] Fetched ${updatedEvents.length} new/updated events. New total: ${totalCount}`
        );
        const { _fullEventCache } = get();
        const mergedEvents = mergeAndDedupeEvents(_fullEventCache, updatedEvents);

        await eventService.cacheEvents(mergedEvents);

        const firstPage = mergedEvents.slice(0, EVENTS_PER_PAGE);

        set({
          _fullEventCache: mergedEvents,
          displayedEvents: firstPage,
          currentPage: 1,
          totalEvents: totalCount,
          // After a sync, properly reset hasMore to allow scrolling through the updated cache.
          hasMore: true,
        });
      } else {
        console.log("[Sync] No new events to sync.");
        // current cache vs totalCount if available.
        const { _fullEventCache, totalEvents } = get();
        if (totalEvents > 0) {
          set({ hasMore: _fullEventCache.length < totalEvents });
        }
      }

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
    if (!useNetworkStatus.getState().isConnected) return;
    try {
      const data = await eventService.fetchCategories();
      set({ categories: [...new Set(data)] });
    } catch (err: any) {
      console.error("Failed to fetch categories:", err.message);
    }
  },

  fetchEventById: async (id: number) => {
    set({ isLoading: true, error: null, currentEvent: null });
    const existingEvent = get()._fullEventCache.find((e) => e.id === id);
    if (existingEvent) {
      set({ currentEvent: existingEvent, isLoading: false });
      return;
    }

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
      // FIX: Replace the simple update function with a smart merge.
      const updateFn = (event: Event) => {
        if (event.id === updatedEvent.id) {
          // 1. Start with the existing event data in the cache.
          // 2. Spread all new data from the incoming 'updatedEvent'.
          // 3. Critically, if 'updatedEvent.attendees' is null/undefined,
          //    fall back to the 'event.attendees' we already have.
          return {
            ...event,
            ...updatedEvent,
            attendees: updatedEvent.attendees ?? event.attendees ?? 0,
          };
        }
        return event;
      };

      const updatedFullCache = state._fullEventCache.map(updateFn);
      const updatedDisplayedEvents = state.displayedEvents.map(updateFn);
      const updatedCurrentEvent =
        state.currentEvent?.id === updatedEvent.id
          ? updateFn(state.currentEvent)
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

useNetworkStatus.getState().registerReconnectCallback(async () => {
  const store = useEvents.getState();

  // Re-enable pagination if it was closed
  if (!store.hasMore) {
    useEvents.setState({
      hasMore: true,
      error: null,
      displayedEvents: [...store.displayedEvents],
    });
  }

  if (store._fullEventCache.length === 0) {
    console.log("[Reconnect] Event cache is empty. Triggering initial load.");
    await store.loadInitialEvents({ query: "", category: "All" });
  }
     await store.syncEvents({ query: "", category: "All" });
});
