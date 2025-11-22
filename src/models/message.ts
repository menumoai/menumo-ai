// src/models/message.ts
import type { Timestamp } from "firebase/firestore";

export type MessageDirection = "outbound" | "inbound";
export type MessageChannel = "sms" | "whatsapp" | "instagram_dm" | "other";
export type MessagePurpose = "order_update" | "promo" | "loyalty" | "support" | "other";
export type MessageStatus = "queued" | "sending" | "sent" | "delivered" | "failed";

export interface Message {
  id: string;
  accountId: string;
  userId?: string | null;
  customerId?: string | null;

  direction: MessageDirection;
  channel: MessageChannel;
  purpose: MessagePurpose;
  templateKey?: string | null;

  body: string;

  status: MessageStatus;
  providerMessageId?: string | null;

  sentAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  failedAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

