// src/models/user.ts
import type { Timestamp } from "firebase/firestore";

export type UserRole = "owner" | "manager" | "staff" | "admin";
export type UserStatus = "invited" | "active" | "disabled";
export type AuthProvider = "password" | "magic_link" | "oauth" | "sso";

export interface AccountUser {
  id: string;        // /accounts/{accountId}/users/{id}
  accountId: string; // FK to BusinessAccount.id

  role: UserRole;
  email: string;
  phone?: string;
  firstName: string;
  lastName?: string;

  isEmployee: boolean;

  status: UserStatus;

  authProvider?: AuthProvider;
  authSubjectId?: string;

  lastLoginAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

