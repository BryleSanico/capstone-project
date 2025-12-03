import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationApiService from "../../services/api/notificationService";
import { useAuth } from "../../stores/auth-store";

export const notificationsKeys = {
  all: ["notifications"] as const,
  count: ["notifications", "count"] as const,
};

export function useNotificationsQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationsKeys.all,
    queryFn: notificationApiService.getNotifications,
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds for new messages
  });
}

export function useUnreadCountQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationsKeys.count,
    queryFn: notificationApiService.getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApiService.markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationsKeys.count });
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApiService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationsKeys.count });
    },
  });
}
