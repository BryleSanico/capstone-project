import { create } from "zustand";
import { Event, EventFormData } from "../types/event";
import { myEventsService } from "../services/myEventsService";
import { handleAsyncAction } from "../utils/system/storeUtils";
import { Alert } from "react-native";
import { Asset } from "react-native-image-picker";
import { useEvents } from "../stores/event-store";

type MyEventsState = {
  myEvents: Event[];
  isLoading: boolean;
  isSyncing: boolean; // Use isSyncing for create/update/delete
  error: string | null;
  loadMyEvents: () => Promise<void>;
  deleteEvent: (eventId: number) => Promise<void>;
  createEvent: (
    fullFormData: EventFormData,
    imageAsset?: Asset | null
  ) => Promise<Event | null>;
  updateEvent: (
    eventId: number,
    fullFormData: EventFormData,
    currentImageUrl: string,
    imageAsset?: Asset | null
  ) => Promise<Event | null>;
  clearUserEvents: () => void;
};

export const useMyEvents = create<MyEventsState>()((set, get) => ({
  myEvents: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  clearUserEvents: () => {
    set({ myEvents: [], isLoading: false, error: null });
  },

  loadMyEvents: async () => {
    await handleAsyncAction(set, get, "isLoading", async () => {
      const events = await myEventsService.getMyEvents();
      return { myEvents: events };
    });
  },

  deleteEvent: async (eventId: number) => {
    // Optimistic update: remove the event from UI immediately
    const previousEvents = get().myEvents;
    set({ myEvents: previousEvents.filter((e) => e.id !== eventId) });

    try {
      // Call the service to delete from DB and clear caches
      await myEventsService.deleteEvent(eventId);
      // Refresh the Discover screen's list.
      // This will safely re-fetch Page 1 and rebuild the ID list
      // *without* destroying the detail cache
      useEvents.getState().refreshEvents({ query: "", category: "All" });
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      // Revert state on failure
      set({ myEvents: previousEvents });
      Alert.alert(
        "Delete Failed",
        "Could not delete the event. Please try again."
      );
    }
  },

  // ADD CREATE EVENT ACTION
  createEvent: async (
    fullFormData: EventFormData,
    imageAsset?: Asset | null
  ): Promise<Event | null> => {
    console.log("[Store createEvent] Calling service...");
    let newEvent: Event | null = null;

    await handleAsyncAction(set, get, "isSyncing", async () => {
      newEvent = await myEventsService.createEvent(fullFormData, imageAsset);
      console.log("[Store createEvent] Service returned:", newEvent);

      // Propagate the change to the global event cache
      useEvents.getState().updateEventInCache(newEvent!); 

      // handleAsyncAction expects a promise returning partial state
      return { myEvents: [newEvent!, ...get().myEvents] };
    });

    if (get().error) {
      Alert.alert(
        "Create Failed",
        get().error || "Could not create the event."
      );
      return null;
    }

    return newEvent;
  },

  // ADD UPDATE EVENT ACTION
  updateEvent: async (
    eventId: number,
    fullFormData: EventFormData,
    currentImageUrl: string,
    imageAsset?: Asset | null
  ): Promise<Event | null> => {
    console.log(`[Store updateEvent ${eventId}] Calling service...`);
    let updatedEvent: Event | null = null;

    await handleAsyncAction(set, get, "isSyncing", async () => {
      updatedEvent = await myEventsService.updateEvent(
        eventId,
        fullFormData,
        currentImageUrl,
        imageAsset
      );
      console.log(
        `[Store updateEvent ${eventId}] Service returned:`,
        updatedEvent
      );

      const newEvents = get().myEvents.map((e) =>
        e.id === updatedEvent!.id ? updatedEvent! : e
      );

      // Propagate the change to the global event cache
      useEvents.getState().updateEventInCache(updatedEvent!);

      return { myEvents: newEvents };
    });

    if (get().error) {
      Alert.alert(
        "Update Failed",
        get().error || "Could not update the event."
      );
      return null;
    }

    return updatedEvent;
  },
}));
