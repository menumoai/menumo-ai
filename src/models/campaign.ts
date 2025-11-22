// src/models/campaign.ts
import type { Timestamp } from "firebase/firestore";

export type CampaignType = "promo" | "loyalty" | "announcement";
export type CampaignChannel = "sms" | "whatsapp" | "email" | "multi";
export type CampaignStatus = "draft" | "scheduled" | "active" | "completed" | "canceled";

export interface Campaign {
  id: string;
  accountId: string;

  name: string;
  description?: string | null;

  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;

  scheduledAt?: Timestamp | null;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;

  targetAllCustomers: boolean;
  tagFilter?: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

