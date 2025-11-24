import { UserRole } from './user';

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
  created_at: string;
}
