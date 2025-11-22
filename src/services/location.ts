// src/services/location.ts
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Location, LocationPing } from "../models/location";

const locationsCol = (accountId: string) =>
  collection(db, "accounts", accountId, "locations");

const locationPingsCol = (accountId: string) =>
  collection(db, "accounts", accountId, "locationPings");

export async function createLocation(params: {
  accountId: string;
  id?: string;
  name: string;
  description?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isTruckLocation?: boolean;
}) {
  const {
    accountId,
    id,
    name,
    description,
    address1,
    address2,
    city,
    state,
    postalCode,
    country,
    latitude,
    longitude,
    isTruckLocation = true,
  } = params;

  const col = locationsCol(accountId);
  const ref = id ? doc(col, id) : doc(col);

  await setDoc(
    ref,
    {
      id: ref.id,
      accountId,
      name,
      description: description ?? null,
      address1: address1 ?? null,
      address2: address2 ?? null,
      city: city ?? null,
      state: state ?? null,
      postalCode: postalCode ?? null,
      country: country ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      isTruckLocation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
}

export async function listLocations(
  accountId: string
): Promise<Location[]> {
  const q = query(locationsCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Location);
}

export async function createLocationPing(params: {
  accountId: string;
  locationId?: string;
  latitude: number;
  longitude: number;
  source: LocationPing["source"];
}) {
  const { accountId, locationId, latitude, longitude, source } = params;

  const ref = await addDoc(locationPingsCol(accountId), {
    accountId,
    locationId: locationId ?? null,
    latitude,
    longitude,
    source,
    recordedAt: new Date(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(ref, { id: ref.id }, { merge: true });
  return ref.id;
}

