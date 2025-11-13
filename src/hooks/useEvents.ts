import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from '@tanstack/react-query';
import * as eventService from '../services/api/eventService'; 
import { Event } from '../types/event';

// This key is used to invalidate event queries from other hooks
export const eventsQueryKey = ['events'];

/**
 * Fetches a single event by ID.
 * Used on EventDetailsScreen.
 */
export function useEventByIdQuery(eventId: number) {
  return useQuery<Event, Error>({
    queryKey: [...eventsQueryKey, 'detail', eventId],
    queryFn: () => eventService.fetchEventById(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Type for the paginated response from our service
type EventsPage = {
  events: Event[];
  totalCount: number;
  nextPage?: number;
};

// Define the shape of our "selected" data
type SelectedEventsData = {
  events: Event[];
  totalCount: number;
};

/**
 * Fetches events with infinite scrolling.
 * Used on DiscoverScreen.
 */
export function useEventsInfiniteQuery(
  query: string,
  category: string,
) {
  const queryKey = [...eventsQueryKey, 'list', query, category];

  return useInfiniteQuery<
    EventsPage,
    Error,
    SelectedEventsData,
    typeof queryKey,
    number // TPageParam
  >({
    queryKey: queryKey,
    // The query function now uses the primitive arguments
    queryFn: ({ pageParam = 1 }) =>
      eventService.fetchEvents({
        pageParam: pageParam,
        query: query,       // Pass primitive
        category: category, // Pass primitive
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.nextPage;
    },
    select: (data): SelectedEventsData => ({
      events: data.pages.flatMap((page) => page.events),
      totalCount: data.pages[0]?.totalCount ?? 0,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * A mutation-like hook to perform a background data sync.
 */
export function useSyncEvents(
  query: string,
  category: string,
) {
  const queryClient = useQueryClient();
  const queryKey = [...eventsQueryKey, 'list', query, category];

  return useMutation<void, Error>({
    mutationFn: async () => {
      const currentData = queryClient.getQueryData<
        InfiniteData<EventsPage>
      >(queryKey);
      
      const cachedEventIds =
        currentData?.pages.flatMap((p) => p.events.map((e) => e.id)) ?? [];

      // Service call still uses an object, which is fine
      const { updatedEvents, deletedEventIds, newEvents, totalCount } =
        await eventService.syncEvents(cachedEventIds, { query, category });

      if (
        updatedEvents.length === 0 &&
        deletedEventIds.length === 0 &&
        newEvents.length === 0
      ) {
        console.log('[Sync] No changes detected.');
        return;
      }

      console.log(
        `[Sync] Applying changes: ${newEvents.length} new, ${updatedEvents.length} updated, ${deletedEventIds.length} deleted.`,
      );

      // Surgically update the cache
      queryClient.setQueryData<InfiniteData<EventsPage>>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page) => ({
            ...page,
            events: [...page.events],
          }));

          if (deletedEventIds.length > 0) {
            newPages.forEach((page, index) => {
              newPages[index].events = page.events.filter(
                (e) => !deletedEventIds.includes(e.id),
              );
            });
          }

          if (updatedEvents.length > 0) {
            const updatesMap = new Map(updatedEvents.map((e) => [e.id, e]));
            newPages.forEach((page, index) => {
              newPages[index].events = page.events.map(
                (e) => updatesMap.get(e.id) || e,
              );
            });
          }

          if (newEvents.length > 0) {
            newPages[0].events = [...newEvents, ...newPages[0].events];
          }

          newPages.forEach((page) => {
            page.totalCount = totalCount;
          });

          return {
            pages: newPages,
            pageParams: oldData.pageParams,
          };
        },
      );
    },
  });
}