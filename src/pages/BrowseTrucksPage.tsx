// src/pages/BrowseTrucksPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listPublicTruckLocations } from "../services/location";
import type { Location } from "../models/location";

// Extend your Location with a derived distance field
type TruckWithDistance = Location & {
    distanceKm?: number | null;
};

type GeoCoords = { lat: number; lng: number };

function haversineKm(a: GeoCoords, b: GeoCoords): number {
    const R = 6371; // km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    const x =
        sinDLat * sinDLat +
        Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
}

export function BrowseTrucksPage() {
    const [trucks, setTrucks] = useState<TruckWithDistance[]>([]);
    const [userLocation, setUserLocation] = useState<GeoCoords | null>(null);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [status, setStatus] = useState("");
    const [selectedCity, setSelectedCity] = useState<string>("all");

    // Load all trucks on first render (no geolocation yet)
    useEffect(() => {
        const init = async () => {
            setStatus("Loading trucks…");
            await loadTrucks(null);
        };

        void init();
         
    }, []);

    const loadTrucks = async (coords: GeoCoords | null) => {
        setLoading(true);
        try {
            const raw: Location[] = await listPublicTruckLocations();

            const mapped: TruckWithDistance[] = raw
                .filter((loc) => loc.isTruckLocation !== false) // treat missing as true
                .map((loc) => {
                    let distanceKm: number | null | undefined = null;

                    if (
                        coords &&
                        typeof loc.latitude === "number" &&
                        typeof loc.longitude === "number"
                    ) {
                        distanceKm = haversineKm(coords, {
                            lat: loc.latitude,
                            lng: loc.longitude,
                        });
                    }

                    return {
                        ...loc,
                        distanceKm,
                    };
                });

            if (coords) {
                mapped.sort((a, b) => {
                    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
                    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
                    return da - db;
                });
                setStatus(
                    `Found ${mapped.length} food truck${mapped.length === 1 ? "" : "s"
                    } near you.`
                );
            } else {
                setStatus(
                    `Found ${mapped.length} food truck${mapped.length === 1 ? "" : "s"
                    }.`
                );
            }

            setTrucks(mapped);
        } catch (err) {
            console.error("Error loading food trucks", err);
            setStatus("Error loading food trucks. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUseMyLocation = async () => {
        setGeoError(null);

        if (!("geolocation" in navigator)) {
            setGeoError(
                "Location is not supported in your browser. Showing all available trucks."
            );
            return;
        }

        setGeoLoading(true);
        setStatus("Finding trucks near you…");

        try {
            const coords = await new Promise<GeoCoords>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                        });
                    },
                    (err) => {
                        reject(err);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 8000,
                    }
                );
            });

            setUserLocation(coords);
            await loadTrucks(coords);
        } catch (err) {
            console.warn("Geolocation error:", err);
            setGeoError(
                "Could not access your location. Still showing all available trucks."
            );
            // keep previously loaded trucks list
        } finally {
            setGeoLoading(false);
        }
    };

    // Build list of unique cities for manual "location" selection
    const cityOptions = Array.from(
        new Set(
            trucks
                .map((t) => t.city)
                .filter((c): c is string => !!c && c.trim().length > 0)
        )
    ).sort();

    const visibleTrucks =
        selectedCity === "all"
            ? trucks
            : trucks.filter((t) => (t.city ?? "").trim() === selectedCity);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <header className="mb-6 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Find Food Trucks Near You
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Browse nearby trucks, check out their menus, and start an order in just a few taps.
                </p>

                {/* Location controls */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={geoLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {geoLoading ? "Using your location…" : "Use my current location"}
                    </button>

                    {cityOptions.length > 0 && (
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span>Or choose a city:</span>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none ring-indigo-500/0 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            >
                                <option value="all">All</option>
                                {cityOptions.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

                {geoError && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        {geoError}
                    </p>
                )}
            </header>

            {loading && visibleTrucks.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Loading trucks…
                </p>
            ) : visibleTrucks.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    No food trucks are available right now. Check back soon!
                </p>
            ) : (
                <section className="grid gap-4 md:grid-cols-2">
                    {visibleTrucks.map((truck) => (
                        <article
                            key={truck.id}
                            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                                    {truck.name}
                                </h2>
                                {truck.city && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {truck.city}
                                        {truck.state ? `, ${truck.state}` : ""}
                                    </p>
                                )}
                                {truck.address1 && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {truck.address1}
                                    </p>
                                )}
                                {typeof truck.distanceKm === "number" && userLocation && (
                                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        ~{truck.distanceKm.toFixed(1)} km away
                                    </p>
                                )}
                                {truck.description && (
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {truck.description}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <Link
                                    to={`/order-form?account=${encodeURIComponent(truck.accountId)}`}
                                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-500"
                                >
                                    View Menu &amp; Order
                                </Link>

                                {userLocation && truck.distanceKm != null && (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Based on your current location
                                    </span>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            )}

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span> {status || "—"}
            </p>
        </div>
    );
}
