import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api/adminService';
import { UserRole } from '../../types/user';
import { Alert } from 'react-native';


// Query Keys for caching
export const ADMIN_KEYS = {
  stats: ['admin', 'stats'],
  pendingEvents: ['admin', 'pendingEvents'],
  users: ['admin', 'users'],
  logs: ['admin', 'logs'],
};

// QUERIES
export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: adminService.getStats,
  });
}

export function usePendingEvents() {
  return useQuery({
    queryKey: ADMIN_KEYS.pendingEvents,
    queryFn: adminService.getPendingEvents,
  });
}

// Infinite Query for Users
export function useUsersInfiniteQuery(searchQuery: string = '') {
  return useInfiniteQuery({
    queryKey: [...ADMIN_KEYS.users, searchQuery],
    queryFn: ({ pageParam = 1 }) => 
      adminService.getPaginatedUsers({ 
        pageParam, 
        query: searchQuery,
        limit: 10 
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

// MUTATIONS

export function useApproveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.approveEvent,
    onSuccess: () => {
      Alert.alert('Success', 'Event approved and live.');
      // Refresh the list and dashboard stats
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.pendingEvents });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve event');
    },
  });
}

export function useRejectEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, hardDelete }: { id: number; reason: string; hardDelete: boolean }) => 
      adminService.rejectEvent(id, reason, hardDelete),
    onSuccess: (_, variables) => {
      const action = variables.hardDelete ? 'denied and deleted' : 'Organizer is notified for revision.';
      Alert.alert('Processed', `Event has been ${action}.`);
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.pendingEvents });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reject event');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: UserRole }) => 
      adminService.updateUserRole(email, role),
    onSuccess: () => {
      Alert.alert('Success', 'User role updated successfully.');
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update role');
    },
  });
}

export function useAdminLogs() {
  return useQuery({
    queryKey: ADMIN_KEYS.logs,
    queryFn: adminService.getLogs,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, banUntil }: { email: string; banUntil: string | null }) => 
      adminService.banUser(email, banUntil),
    onSuccess: (_, variables) => {
      const action = variables.banUntil ? 'banned' : 'unbanned';
      Alert.alert('Success', `User has been ${action}.`);
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to change ban status');
    },
  });
}