import { create } from "zustand";
import { Event, EventFormData } from "../types/event"; 
import { myEventsService } from "../services/myEventsService";
import { handleAsyncAction } from "../utils/storeUtils";
import { Alert } from "react-native";

type MyEventsState = {
  myEvents: Event[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  loadMyEvents: () => Promise<void>;
  deleteEvent: (eventId: number) => Promise<void>;
createEvent: (formData: EventFormData) => Promise<Event | null>; // Return created event or null on error
  updateEvent: (eventId: number, formData: EventFormData) => Promise<Event | null>; // Return updated event or null on error
  // updateEventInStore is replaced by updateEvent
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
    set({ myEvents: previousEvents.filter(e => e.id !== eventId) });

    try {
      // Call the service to delete from DB and clear caches
      await myEventsService.deleteEvent(eventId);
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      // Revert state on failure
      set({ myEvents: previousEvents });
      Alert.alert("Delete Failed", "Could not delete the event. Please try again.");
    }
  },

 // ADD CREATE EVENT ACTION
  createEvent: async (formData: EventFormData): Promise<Event | null> => {
    try {
      const newEvent = await myEventsService.createEvent(formData);
      // Add the new event to the beginning of the list
      set((state) => ({ 
        myEvents: [newEvent, ...state.myEvents] 
      }));
      return newEvent; // Return the created event on success
    } catch (err: any) {
      console.error("Failed to create event:", err);
      Alert.alert("Create Failed", err.message || "Could not create the event. Please try again.");
      return null; // Return null on error
    }
  },

  // ADD UPDATE EVENT ACTION
  updateEvent: async (eventId: number, formData: EventFormData): Promise<Event | null> => {
    // Similar to create, handle state/errors in the calling screen
    try {
      const updatedEvent = await myEventsService.updateEvent(eventId, formData);
      // Update the event in the list
      set((state) => ({
        myEvents: state.myEvents.map(e => 
          e.id === updatedEvent.id ? updatedEvent : e
        ),
      }));
      return updatedEvent; // Return updated event on success
    } catch (err: any) {
      console.error("Failed to update event:", err);
      Alert.alert("Update Failed", err.message || "Could not update the event. Please try again.");
      return null; // Return null on error
    }
  },
}));