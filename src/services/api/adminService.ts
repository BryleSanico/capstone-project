import { supabase } from '../../lib/supabase';
import { eventMapper } from '../../utils/mappers/eventMapper';
import { Event } from '../../types/event';
import { UserRole } from '../../types/user';
import { AdminStats, AdminUser } from '../../types/admin';

export const adminService = {
  /**
   * Fetches dashboard statistics via RPC.
   */
  async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) throw error;
    return data as AdminStats;
  },

  /**
   * Fetches all events waiting for approval via secure RPC (Bypassing RLS).
   */
  async getPendingEvents(): Promise<Event[]> {
    console.log('[AdminService] Fetching pending events...');
    const { data, error } = await supabase.rpc('get_pending_events_admin');
    
    if (error) {
        console.error('[AdminService] RPC Error:', error);
        throw error;
    }

    // Safety check: Ensure data is an array before mapping
    const safeData = data || [];

    return safeData.map((raw: any) => eventMapper(raw));
  },

  /**
   * Approves an event, making it live.
   */
  async approveEvent(eventId: number): Promise<void> {
    const { error } = await supabase.rpc('admin_approve_event', { p_event_id: eventId });
    if (error) throw error;
  },

  /**
   * Rejects an event with a reason message.
   */
  async rejectEvent(eventId: number, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_reject_event', { 
        p_event_id: eventId,
        p_reason: reason
    });
    if (error) throw error;
  },

  /**
   * Fetches all users and their roles (Super Admin only).
   */
  async getAllUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase.rpc('get_all_users_admin');
    if (error) throw error;
    return (data || []) as AdminUser[];
  },

  /**
   * Updates a user's role (Super Admin only).
   */
  async updateUserRole(email: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase.rpc('promote_user_to_role', {
      p_email: email,
      p_role: newRole,
    });
    if (error) throw error;
  }
};