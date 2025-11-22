// src/models/customer.ts
import type { Timestamp } from "firebase/firestore";

export type PreferredChannel = "sms" | "whatsapp" | "instagram_dm" | "none";

export interface Customer {
  id: string;
  accountId: string;

  name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;

  preferredChannel?: PreferredChannel;
  marketingOptIn: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

