import { supabase } from "../../lib/supabase";
import { eventMapper } from "../../utils/mappers/eventMapper";
import { Event } from "../../types/event";
import { UserRole } from "../../types/user";
import { AdminLog, AdminStats, AdminUser } from "../../types/admin";
import { logger } from "../../utils/system/logger";

// Define the response shape for pagination
export type PaginatedUsersResponse = {
  users: AdminUser[];
  totalCount: number;
  nextPage?: number;
};

export const adminService = {
  /**
   * Fetches dashboard statistics via RPC.
   */
  async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc("get_admin_stats");
    if (error) throw error;
    return data as AdminStats;
  },

  /**
   * Fetches all events waiting for approval via secure RPC (Bypassing RLS).
   */
  async getPendingEvents(): Promise<Event[]> {
    logger.info("[AdminService] Fetching pending events...");
    const { data, error } = await supabase.rpc("get_pending_events_admin");

    if (error) {
      logger.error("[AdminService] RPC Error:", error);
      throw error;
    }
    return (data || []).map(eventMapper);
  },

  async approveEvent(eventId: number): Promise<void> {
    const { error } = await supabase.rpc("admin_approve_event", {
      p_event_id: eventId,
    });
    if (error) throw error;
  },

  /**
   * Rejects an event with a reason message.
   */
  async rejectEvent(
    eventId: number,
    reason: string,
    hardDelete: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc("admin_reject_event", {
      p_event_id: eventId,
      p_reason: reason,
      p_hard_delete: hardDelete,
    });
    if (error) throw error;
  },

  /**
   * Fetches paginated users with search support.
   */
  async getPaginatedUsers({
    pageParam = 1,
    query = "",
    limit = 10,
  }: {
    pageParam: number;
    query: string;
    limit?: number;
  }): Promise<PaginatedUsersResponse> {
    const { data, error } = await supabase.rpc("get_paginated_users_admin", {
      p_page: pageParam,
      p_limit: limit,
      p_query: query,
    });

    if (error) throw error;

    const users = (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role as UserRole,
      banned_until: user.banned_until,
      created_at: user.created_at,
    }));

    const totalCount =
      data && data.length > 0 ? Number(data[0].total_count) : 0;
    const hasNextPage =
      users.length === limit && pageParam * limit < totalCount;

    return {
      users,
      totalCount,
      nextPage: hasNextPage ? pageParam + 1 : undefined,
    };
  },

  /**
   * Updates a user's role (Super Admin only).
   */
  async updateUserRole(email: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase.rpc("promote_user_to_role", {
      p_email: email,
      p_role: newRole,
    });
    if (error) throw error;
  },

  /**
   * Bans or Unbans a user.
   * @param email User email
   * @param banUntil ISO string date to ban until, or NULL to unban.
   */
  async banUser(email: string, banUntil: string | null): Promise<void> {
    const { error } = await supabase.rpc("admin_ban_user", {
      p_email: email,
      p_ban_until: banUntil,
    });
    if (error) throw error;
  },

  /**
   * Fetches admin logs.
   */
  async getLogs(): Promise<AdminLog[]> {
    const { data, error } = await supabase.rpc("get_admin_logs");
    if (error) throw error;
    return data as AdminLog[];
  },
};

