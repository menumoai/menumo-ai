// src/models/order.ts
import type { Timestamp } from "firebase/firestore";

export type OrderChannel =
  | "sms"
  | "web_form"
  | "qr_code"
  | "in_person"
  | "phone"
  | "other";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "canceled"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial";
export type PaymentMethod = "cash" | "card" | "zelle" | "cashapp" | "venmo" | "other";

export interface Order {
  id: string;
  accountId: string;
  customerId?: string | null;

  channel: OrderChannel;
  status: OrderStatus;

  placedAt: Timestamp;
  acceptedAt?: Timestamp | null;
  readyAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  canceledAt?: Timestamp | null;

  prepTimeEstimateSeconds?: number;
  prepTimeActualSeconds?: number;

  locationId?: string | null;

  subtotalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;

  currency?: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;

  notes?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type OrderLineItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "canceled";

export interface OrderLineItem {
  id: string;
  orderId: string;
  accountId: string;
  productId: string;

  quantity: number;
  unitPrice: number;
  lineSubtotal: number;

  status: OrderLineItemStatus;
  specialInstructions?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

