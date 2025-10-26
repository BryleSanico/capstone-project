import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEvents } from '../stores/event-store';
import { eventMapper } from '../utils/mappers/eventMapper';

/**
 * A custom hook that subscribes to real-time updates for a single event.
 * When an update is received from Supabase, it updates the central event store.
 *
 * @param eventId The ID of the event to listen to.
 */
export default function useEventSubscription(eventId: number | null) {
  const { updateEventInCache } = useEvents();

  useEffect(() => {
    // Only subscribe if we have a valid eventId
    if (!eventId) return;

    // Define the subscription channel for the specific event
    const channel = supabase
      .channel(`event-details-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`, // Only listen for changes to this specific event
        },
        (payload) => {
          console.log('🟢 Real-time event update received!', payload.new);

          // FIX: Use the exported eventMapper from the service
          const updatedEvent = eventMapper(payload.new);
          
          // Update the central Zustand store with the new event data.
          // This will trigger a re-render in any component using this event.
          updateEventInCache(updatedEvent);
        }
      )
      .subscribe();

    // Return a cleanup function to unsubscribe when the component unmounts to prevent memory leaks.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, updateEventInCache]);
}