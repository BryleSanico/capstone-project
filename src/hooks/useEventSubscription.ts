import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { eventMapper } from '../utils/mappers/eventMapper';
import { useQueryClient } from '@tanstack/react-query';
import { eventsQueryKey } from './useEvents';
import { Event } from '../types/event';

/**
 * A custom hook that subscribes to real-time updates for a single event.
 * When an update is received, it updates the React Query cache.
 *
 * @param eventId The ID of the event to listen to.
 */
export default function useEventSubscription(eventId: number | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-details-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          console.log('🟢 Real-time event update received!', payload.new);
          
          const updatedEvent = eventMapper(payload.new);
          
          // Get the query key for this specific event
          const queryKey = [...eventsQueryKey, 'detail', eventId];
          
          // Set the new data in the cache for this query.
          // Instantly update EventDetailsScreen if it's open.
          queryClient.setQueryData<Event>(queryKey, updatedEvent);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);
}