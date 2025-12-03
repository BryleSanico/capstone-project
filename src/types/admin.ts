import { UserRole } from "./user";

/**
 * Defines the shape of data for Admin-related operations.
 */

export interface AdminStats {
  total_users: number;
  total_events: number;
  pending_events: number;
  total_revenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  banned_until: string | null;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin_email: string;
  admin_name: string | null;
  action_type:
    | "APPROVE_EVENT"
    | "REJECT_DELETE"
    | "REJECT_REVISION"
    | "PROMOTE_USER";
  target_id: string;
  details: string;
  created_at: string;
}
