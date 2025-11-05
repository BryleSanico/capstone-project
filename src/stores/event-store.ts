import { create } from "zustand";
import { Event } from "../types/event";
import { eventService } from "../services/eventService";
import { handleAsyncAction } from "../utils/system/storeUtils";
import { prefetchImages } from "../utils/cache/imageCache";
import storageService from "../services/storageService"; 
import { storageKeys } from "../utils/cache/storageKeys";
import { cacheEventDetails } from '../services/cache/eventCacheService';

const EVENTS_PER_PAGE = 3;

type EventsState = {
  _fullEventCache: Event[];
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
  fetchEventById: (id: number) => Promise<void>;
  decrementEventSlots: (eventId: number, quantity: number) => void;
  updateEventInCache: (updatedEvent: Event) => void;
};

// --- Internal State Updaters ---
const _updateEventInState = (
  state: EventsState,
  eventId: number,
  updateFn: (event: Event) => Event
): Partial<EventsState> => {
  let updatedEvent: Event | undefined;

  const updateAndFind = (event: Event) => {
    if (event.id === eventId) {
      updatedEvent = updateFn(event);
      return updatedEvent;
    }
    return event;
  };

  const updatedFullCache = state._fullEventCache.map(updateAndFind);
  const updatedDisplayedEvents = state.displayedEvents.map(
    (e) => (e.id === eventId ? updatedEvent! : e)
  );
  const updatedCurrentEvent =
    state.currentEvent?.id === eventId
      ? updatedEvent!
      : state.currentEvent;

  if (updatedEvent) {
    cacheEventDetails([updatedEvent]);
  }

  return {
    _fullEventCache: updatedFullCache,
    displayedEvents: updatedDisplayedEvents,
    currentEvent: updatedCurrentEvent,
  };
};

// --- Zustand Store Definition ---

export const useEvents = create<EventsState>()((set, get) => {
  
  return {
    _fullEventCache: [],
    displayedEvents: [],
    currentPage: 1,
    totalEvents: 0,
    isLoading: true, // Start in loading state for initial fetch
    isSyncing: false,
    error: null,
    hasMore: true,
    categories: ["All"],
    currentEvent: null,

    loadInitialEvents: async (filters) => {
      await handleAsyncAction(set, get, "isLoading", async () => {
        set({ currentPage: 1, displayedEvents: [], _fullEventCache: [] });
        
        const { events, total } = await eventService.getInitialEvents(filters);
        const firstPage = events.slice(0, EVENTS_PER_PAGE);

        // Prefetch images for first page and next page
        const imagesToPrefetch = events
          .slice(0, EVENTS_PER_PAGE * 2)
          .map(event => event.imageUrl);
        await prefetchImages(imagesToPrefetch);

        return {
          _fullEventCache: events,
          displayedEvents: firstPage,
          totalEvents: total,
          hasMore: firstPage.length < total, 
          currentPage: 1,
        };
      });
    },

    loadMoreEvents: async (filters) => {
      const { currentPage, _fullEventCache, displayedEvents, hasMore } = get();
      if (get().isSyncing || !hasMore) return;
      
      // Try loading from local cache first
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
          hasMore: nextOffset + nextBatch.length < get().totalEvents,
        });
        return;
      }

      // If local cache is exhausted, fetch from network
      await handleAsyncAction(set, get, "isSyncing", async () => {
        const { events: newFullCache, total: newTotal } =
          await eventService.getMoreEvents(
            filters,
            get().currentPage,
            get()._fullEventCache
          );

        const newDisplayedEvents = newFullCache.slice(0, (get().currentPage + 1) * EVENTS_PER_PAGE);
        
        return {
          _fullEventCache: newFullCache,
          displayedEvents: newDisplayedEvents,
          currentPage: get().currentPage + 1,
          totalEvents: newTotal,
          hasMore: newDisplayedEvents.length < newTotal,
        };
      });
    },

    syncEvents: async (filters) => {
      await handleAsyncAction(set, get, "isSyncing", async () => {
        const { 
          _fullEventCache: oldCache, 
          displayedEvents: oldDisplayed,
          totalEvents: oldTotal 
        } = get();
        
        const newFullCache = await eventService.syncEventCache(oldCache, filters); 

        if (newFullCache) {
          const newTotal = await storageService.getItem<number>(
            storageKeys.getEventsTotalCountKey()
          ) ?? oldTotal; 

          const newDisplayedMapped = newFullCache
            .slice(0, oldDisplayed.length);

          return {
            _fullEventCache: newFullCache,
            displayedEvents: newDisplayedMapped,
            totalEvents: newTotal, 
            hasMore: newDisplayedMapped.length < newTotal, 
          };
        }
        return {};
      });
    },

    refreshEvents: async (filters) => {
      await handleAsyncAction(set, get, "isSyncing", async () => {
        const { events, total } = await eventService.refreshEventCache(
          filters
        );
        const firstPage = events.slice(0, EVENTS_PER_PAGE);

        return {
          _fullEventCache: events,
          displayedEvents: firstPage,
          totalEvents: total,
          hasMore: firstPage.length < total,
          currentPage: 1,
        };
      });
    },

    fetchEventById: async (id: number) => {
      await handleAsyncAction(set, get, "isLoading", async () => {
        const event = await eventService.fetchEventById(id);
        if (event) {
          return { currentEvent: event };
        }
        return { error: "Event details could not be loaded." };
      });
    },

    decrementEventSlots: (eventId: number, quantity: number) => {
      set((state) =>
        _updateEventInState(state, eventId, (event) => ({
          ...event,
          attendees: event.attendees + quantity,
          availableSlot: event.availableSlot - quantity,
          // isClosed: event.availableSlot - quantity <= 0 ? true : event.isClosed,
        }))
      );
    },

    updateEventInCache: (updatedEvent: Event) => {
      set((state) =>
        _updateEventInState(state, updatedEvent.id, (event) => {
           // We are only updating the fields from the server response.
           // We should PRESERVE the existing organizer data if the incoming 
           // updatedEvent does not contain a populated profile object.
           const updatedData = {
              ...event,
              ...updatedEvent,
              // Preserve existing organizer data if the new data is the placeholder
              organizer: updatedEvent.organizer.fullName !== "Community Event" 
                         ? updatedEvent.organizer 
                         : event.organizer,
              attendees: updatedEvent.attendees ?? event.attendees ?? 0,
            };

            // Ensure the update cascades correctly if the event being updated 
            // is the one that has the correct organizer (the one from cache).
            return updatedData;
        })
      );
    },
  };
});

// Moved outside the create() call to prevent initialization error.
useEvents.subscribe((state, prevState) => {
  if (state._fullEventCache !== prevState._fullEventCache) {
    const categorySet = new Set<string>();
    state._fullEventCache.forEach((event) => {
      if (event.category) {
        categorySet.add(event.category);
      }
    });
    
    const distinctCategories = Array.from(categorySet).sort();
    const newCategories = ["All", ...distinctCategories];

    // Check against current state to prevent infinite loops
    if (JSON.stringify(useEvents.getState().categories) !== JSON.stringify(newCategories)) {
      useEvents.setState({ categories: newCategories });
    }
  }
});