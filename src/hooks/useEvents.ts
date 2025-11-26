import {
  useQuery,
  useInfiniteQuery,
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
    refetchOnReconnect: false,
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