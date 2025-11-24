import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api/adminService';
import { UserRole } from '../types/user';
import { Alert } from 'react-native';

// Query Keys for caching
export const ADMIN_KEYS = {
  stats: ['admin', 'stats'],
  pendingEvents: ['admin', 'pendingEvents'],
  users: ['admin', 'users'],
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

export function useAllUsers() {
  return useQuery({
    queryKey: ADMIN_KEYS.users,
    queryFn: adminService.getAllUsers,
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
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      adminService.rejectEvent(id, reason),
    onSuccess: () => {
      // Refresh the list
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