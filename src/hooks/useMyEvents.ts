import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as myEventsService from '../services/api/myEventsService';
import { Event, EventFormData } from '../types/event';
import { useAuth } from '../stores/auth-store';
import { eventsQueryKey } from './useEvents'; 
import { Asset } from 'react-native-image-picker';
import { Alert } from 'react-native';

// Define the central query key
export const myEventsQueryKey = ['myEvents'];

/**
 * Fetches all events organized by the current user.
 */
export function useMyEventsQuery() {
  const { user } = useAuth();
  return useQuery<Event[], Error>({
    queryKey: myEventsQueryKey,
    queryFn: myEventsService.getMyEvents,
    enabled: !!user, // Only run when user is logged in
  });
}

/**
 * A mutation for creating a new event.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation<
    Event,
    Error,
    { formData: EventFormData; imageAsset: Asset | null }
  >({
    mutationFn: ({ formData, imageAsset }) =>
      myEventsService.createEvent(formData, imageAsset),
    onSuccess: (_newEvent) => {
      // Invalidate both myEvents and the public event list
      queryClient.invalidateQueries({ queryKey: myEventsQueryKey });
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });
    },
    onError: (error) => {
      Alert.alert('Create Failed', error.message);
    },
  });
}

/**
 * A mutation for updating an existing event.
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation<
    Event,
    Error,
    {
      eventId: number;
      formData: EventFormData;
      currentImageUrl: string;
      imageAsset: Asset | null;
      isClosed: boolean;
    }
  >({
    mutationFn: (variables) => myEventsService.updateEvent(
      variables.eventId,
      variables.formData,
      variables.currentImageUrl,
      variables.imageAsset,
      variables.isClosed,
    ),
    onSuccess: (updatedEvent) => {
      // Invalidate all event-related data
      queryClient.invalidateQueries({ queryKey: myEventsQueryKey });
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });
      // Also invalidate the specific detail query for this event
      queryClient.invalidateQueries({
        queryKey: [...eventsQueryKey, 'detail', updatedEvent.id],
      });
    },
    onError: (error) => {
      Alert.alert('Update Failed', error.message);
    },
  });
}

/**
 * A mutation for deleting an event.
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: myEventsService.deleteEvent,
    onSuccess: () => {
      // Invalidate all event-related data
      queryClient.invalidateQueries({ queryKey: myEventsQueryKey });
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });
    },
    onError: (error) => {
      Alert.alert('Delete Failed', error.message);
    },
  });
}