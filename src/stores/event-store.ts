import { create } from "zustand";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";
import { useNetworkStatus } from "../stores/network-store";
import { mergeAndDedupeEvents } from "../utils/cacheUtils";

const EVENTS_PER_PAGE = 3;

type EventsState = {
  // This holds the full list of all events ever loaded/synced.
  _fullEventCache: Event[];
  // This holds only the events currently visible in the FlatList.
  displayedEvents: Event[];
  currentPage: number;
  totalEvents: number;
  isLoading: boolean; // For initial load from AsyncStorage
  isSyncing: boolean; // For background network sync
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
  // fetchCategories is no longer an async action, so it's removed from the type
  fetchEventById: (id: number) => Promise<void>;
  decrementEventSlots: (eventId: number, quantity: number) => void;
  updateEventInCache: (updatedEvent: Event) => void;
};

export const useEvents = create<EventsState>()((set, get) => {
  const _updateCategoriesFromCache = () => {
    const { _fullEventCache } = get();
    if (_fullEventCache.length === 0) {
      set({ categories: ["All"] }); // Fallback
      return;
    }

    // Use a Set for efficient, unique extraction
    const categorySet = new Set<string>();
    _fullEventCache.forEach((event) => {
      if (event.category) {
        // Ensure category is not null/undefined
        categorySet.add(event.category);
      }
    });

    const distinctCategories = Array.from(categorySet).sort();
    console.log(
      `[Categories] Derived from cache. Found: ${distinctCategories.join(", ")}`
    );
    set({ categories: ["All", ...distinctCategories] });
  };

  return {
    _fullEventCache: [],
    displayedEvents: [],
    currentPage: 1,
    totalEvents: 0,
    isLoading: true, // Start loading from cache immediately
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
        _updateCategoriesFromCache();
      }
    },

    loadInitialEvents: async (filters) => {
      set({
        isLoading: true,
        error: null,
        currentPage: 1,
        displayedEvents: [],
        _fullEventCache: [], // Clear cache temporarily
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

      // Always derive categories from cache after initial load
      _updateCategoriesFromCache();
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

      // Show next cached events first
      const nextOffset = currentPage * EVENTS_PER_PAGE;
      if (nextOffset < _fullEventCache.length) {
        const nextBatch = _fullEventCache.slice(
          nextOffset,
          nextOffset + EVENTS_PER_PAGE
        );
        console.log(
          `[Load More] Showing ${nextBatch.length} cached events (page ${
            currentPage + 1
          }).`
        );

        set({
          displayedEvents: [...displayedEvents, ...nextBatch],
          currentPage: currentPage + 1,
          hasMore:
            nextOffset + nextBatch.length < _fullEventCache.length || true,
        });
        return;
      }

      // If no more cached pages, fetch new ones
      if (!isConnected) {
        console.log("[Load More] Offline. No more cached events to display.");
        set({ hasMore: false });
        return;
      }

      console.log(
        "[Load More] Cached pages exhausted. Fetching new events from server..."
      );
      set({ isSyncing: true });

      try {
        const nextPage = currentPage + 1;
        const { events: newEvents, totalCount } =
          await eventService.fetchEvents(
            nextPage,
            EVENTS_PER_PAGE,
            filters.query,
            filters.category,
            null
          );

        if (newEvents.length > 0) {
          const updatedFullCache = mergeAndDedupeEvents(
            _fullEventCache,
            newEvents
          );
          const newDisplayedEvents = [
            ...displayedEvents,
            ...newEvents.filter(
              (e) => !displayedEvents.some((de) => de.id === e.id)
            ),
          ];

          console.log(
            `[Load More] Added ${newEvents.length} new events from server. Total displayed: ${newDisplayedEvents.length}.`
          );

          await eventService.cacheEvents(updatedFullCache);

          set({
            _fullEventCache: updatedFullCache,
            displayedEvents: newDisplayedEvents,
            currentPage: nextPage,
            totalEvents: totalCount,
            hasMore: newDisplayedEvents.length < totalCount,
          });

          // Update categories if new events were loaded
          _updateCategoriesFromCache();
        } else {
          console.log("[Load More] No more events to fetch from server.");
          set({ hasMore: false });
        }
      } catch (err: any) {
        console.error("[Load More] Failed to load more events:", err);
        set({ error: "Could not load more events." });
      } finally {
        set({ isSyncing: false });
      }
    },

    syncEvents: async (filters) => {
      if (!useNetworkStatus.getState().isConnected || get().isSyncing) {
        console.log("[Sync] Skipped - Offline or already syncing.");
        return;
      }

      set({ isSyncing: true, error: null });

      try {
        const { _fullEventCache } = get();
        if (_fullEventCache.length === 0) {
          console.log("[Sync] No cached events available for comparison.");
          set({ isSyncing: false });
          return;
        }

        const cachedIds = _fullEventCache.map((e) => e.id);
        const localTimestamp = await eventService.getLastSyncTimestamp();
        const serverTimestamp = await eventService.getLatestEventTimestamp();

        if (
          serverTimestamp &&
          localTimestamp &&
          new Date(localTimestamp) >= new Date(serverTimestamp)
        ) {
          console.log("[Sync] Local cache is already up-to-date.");
          set({ isSyncing: false, hasMore: true });
          return;
        }

        // Fetch only updated cached events
        const updatedEvents = await eventService.fetchUpdatedCachedEvents(
          cachedIds,
          localTimestamp || "2025-01-01T00:00:00Z"
        );

        if (updatedEvents.length > 0) {
          console.log(
            `[Sync] Found ${updatedEvents.length} updated events from Supabase.`
          );

          const mergedEvents = mergeAndDedupeEvents(
            _fullEventCache,
            updatedEvents
          );
          await eventService.cacheEvents(mergedEvents);

          const firstPage = mergedEvents.slice(0, EVENTS_PER_PAGE);
          set({
            _fullEventCache: mergedEvents,
            displayedEvents: firstPage,
            currentPage: 1,
            hasMore: firstPage.length < mergedEvents.length,
          });
        } else {
          console.log("[Sync] No cached events required updates.");
        }

        if (serverTimestamp) {
          await eventService.setLastSyncTimestamp(serverTimestamp);
        }

        // Ensure categories are derived even if no new events
        _updateCategoriesFromCache();
      } catch (err: any) {
        console.error("[Sync] Failed to sync:", err);
        set({ error: "Failed to sync with the server." });
      } finally {
        set({ isSyncing: false });
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
        const updateFn = (event: Event) => {
          if (event.id === updatedEvent.id) {
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

        // Update categories when a real-time update occurs
        _updateCategoriesFromCache();

        return {
          _fullEventCache: updatedFullCache,
          displayedEvents: updatedDisplayedEvents,
          currentEvent: updatedCurrentEvent,
        };
      });
    },
  };
});

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
