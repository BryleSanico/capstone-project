export type UserRole = "user" | "admin" | "super_admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role?: UserRole;
}
