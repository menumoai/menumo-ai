// src/models/location.ts
import type { Timestamp } from "firebase/firestore";

export interface Location {
  id: string;
  accountId: string;

  name: string;
  description?: string | null;

  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  latitude?: number;
  longitude?: number;

  isTruckLocation: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type LocationPingSource = "gps" | "manual" | "import";

export interface LocationPing {
  id: string;
  accountId: string;
  locationId?: string | null;

  latitude: number;
  longitude: number;

  source: LocationPingSource;
  recordedAt: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

