import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { eventsQueryKey } from "./useEvents";

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

    console.log(`[EventSubscription] Subscribing to event ${eventId}...`);

    const channel = supabase
      .channel(`event-details-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          console.log("🟢 Real-time event update received!", payload.new);

          // Invalidate to refetch fresh data (safest for relations)
          // This fetches the full event again including joined tables (organizer, etc.)
          const queryKey = [...eventsQueryKey, "detail", eventId];
          queryClient.invalidateQueries({ queryKey });

          // Also refresh the list view so the main feed is accurate
          queryClient.invalidateQueries({ queryKey: ["events", "list"] });
        }
      )
      .subscribe();

    return () => {
      console.log(`[EventSubscription] Unsubscribing from event ${eventId}`);
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);
}
