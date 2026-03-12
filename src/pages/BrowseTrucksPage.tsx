// src/pages/BrowseTrucksPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    MapPin,
    Plus,
    BarChart3,
    Calendar,
    TrendingUp,
    Search,
    Target,
    AlertCircle,
} from "lucide-react";

import { useAccount } from "../account/AccountContext";
import { listPublicTruckLocations } from "../services/location";
import type { Location } from "../models/location";

type TruckLocation = Location;

export function BrowseTrucksPage() {
    const { accountId, account, loading: accountLoading } = useAccount();

    const [locations, setLocations] = useState<TruckLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [selectedCity, setSelectedCity] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const init = async () => {
            if (!accountId) return;

            setLoading(true);
            setStatus("Loading locations...");

            try {
                const raw: Location[] = await listPublicTruckLocations();

                const filtered = raw.filter(
                    (loc) =>
                        loc.accountId === accountId && loc.isTruckLocation !== false
                );

                setLocations(filtered);
                setStatus(
                    `Loaded ${filtered.length} location${filtered.length === 1 ? "" : "s"}.`
                );
            } catch (err) {
                console.error("Error loading locations", err);
                setStatus("Error loading locations.");
            } finally {
                setLoading(false);
            }
        };

        void init();
    }, [accountId]);

    const cityOptions = useMemo(() => {
        return Array.from(
            new Set(
                locations
                    .map((loc) => loc.city)
                    .filter((c): c is string => !!c && c.trim().length > 0)
            )
        ).sort();
    }, [locations]);

    const filteredLocations = useMemo(() => {
        return locations.filter((loc) => {
            const matchesCity =
                selectedCity === "all" || (loc.city ?? "").trim() === selectedCity;

            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                q.length === 0 ||
                (loc.name ?? "").toLowerCase().includes(q) ||
                (loc.city ?? "").toLowerCase().includes(q) ||
                (loc.state ?? "").toLowerCase().includes(q) ||
                (loc.address1 ?? "").toLowerCase().includes(q) ||
                (loc.description ?? "").toLowerCase().includes(q);

            return matchesCity && matchesSearch;
        });
    }, [locations, selectedCity, searchQuery]);

    const stats = useMemo(() => {
        const totalLocations = locations.length;
        const uniqueCities = new Set(
            locations.map((loc) => loc.city).filter(Boolean)
        ).size;

        const mappedLocations = locations.filter(
            (loc) =>
                typeof loc.latitude === "number" && typeof loc.longitude === "number"
        ).length;

        const cityCounts = new Map<string, number>();
        for (const loc of locations) {
            const city = (loc.city ?? "").trim();
            if (!city) continue;
            cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
        }

        let topCity = "—";
        let topCityCount = 0;
        for (const [city, count] of cityCounts.entries()) {
            if (count > topCityCount) {
                topCity = city;
                topCityCount = count;
            }
        }

        return {
            totalLocations,
            uniqueCities,
            mappedLocations,
            topCity,
            topCityCount,
        };
    }, [locations]);

    const insightCards = useMemo(() => {
        const cards: { icon: "target" | "alert"; title: string; description: string; badge: string }[] = [];

        if (stats.topCity !== "—") {
            cards.push({
                icon: "target",
                title: `Strongest coverage in ${stats.topCity}`,
                description: `You currently have ${stats.topCityCount} tracked location${stats.topCityCount === 1 ? "" : "s"} in ${stats.topCity}.`,
                badge: `${stats.topCityCount} location${stats.topCityCount === 1 ? "" : "s"}`,
            });
        }

        if (stats.mappedLocations < stats.totalLocations) {
            cards.push({
                icon: "alert",
                title: "Some locations are missing coordinates",
                description: "Add latitude and longitude so these trucks can support map-based features and smarter routing later.",
                badge: `${stats.totalLocations - stats.mappedLocations} missing`,
            });
        } else if (stats.totalLocations > 0) {
            cards.push({
                icon: "target",
                title: "All tracked locations are map-ready",
                description: "Every current truck location has coordinates saved, which is great for future routing and analytics.",
                badge: "Map ready",
            });
        }

        return cards.slice(0, 2);
    }, [stats]);

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                No account selected.
            </p>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Locations
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Track and review truck locations for{" "}
                            <span className="font-medium text-gray-900">
                                {account?.name ?? accountId}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-4 py-2.5 text-sm font-medium text-white shadow-lg opacity-70"
                        title="Add location workflow coming next"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                    </button>
                </div>

                {/* Hero Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 p-6 border border-blue-200 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500">
                            <MapPin className="h-5 w-5 text-white" />
                        </div>

                        <div className="flex-1">
                            <h3
                                className="mb-2 text-lg font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Location Performance Snapshot
                            </h3>
                            <p className="mb-4 text-sm text-gray-600">
                                You currently have {stats.totalLocations} tracked truck location
                                {stats.totalLocations === 1 ? "" : "s"} across {stats.uniqueCities} cit
                                {stats.uniqueCities === 1 ? "y" : "ies"}. Your strongest location coverage is in{" "}
                                <span className="font-semibold text-gray-900">{stats.topCity}</span>.
                            </p>

                            <div className="grid gap-4 md:grid-cols-2">
                                {insightCards.map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-blue-200 bg-white p-4"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                {card.icon === "target" ? (
                                                    <Target className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                                )}
                                                <h4 className="font-semibold text-gray-900">
                                                    {card.title}
                                                </h4>
                                            </div>
                                        </div>

                                        <p className="mb-2 text-sm text-gray-600">
                                            {card.description}
                                        </p>

                                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                            {card.badge}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Locations</span>
                            <MapPin className="h-4 w-4 text-[#5B9A8B]" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalLocations}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Tracked truck locations
                        </div>
                    </div>

                    <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Top City</span>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.topCity}
                        </div>
                        <div className="mt-1 text-xs text-green-600">
                            {stats.topCityCount > 0
                                ? `${stats.topCityCount} tracked`
                                : "No city data"}
                        </div>
                    </div>

                    <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Cities</span>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.uniqueCities}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Unique city markets
                        </div>
                    </div>

                    <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Map Ready</span>
                            <BarChart3 className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.mappedLocations}/{stats.totalLocations}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            With saved coordinates
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>

                        {cityOptions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCity("all")}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${selectedCity === "all"
                                            ? "bg-teal-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    All Cities
                                </button>

                                {cityOptions.map((city) => (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => setSelectedCity(city)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${selectedCity === city
                                                ? "bg-teal-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Location List */}
                <section className="space-y-4">
                    <div>
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Location Performance
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Review your tracked truck stops and operating locations
                        </p>
                    </div>

                    {loading && filteredLocations.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">Loading locations...</p>
                        </div>
                    ) : filteredLocations.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">
                                No locations match this filter.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredLocations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:shadow-lg"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <MapPin className="h-5 w-5 text-[#5B9A8B]" />
                                                <h4 className="text-lg font-bold text-gray-900">
                                                    {loc.name}
                                                </h4>

                                                <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                                    Active
                                                </span>
                                            </div>

                                            <div className="grid gap-2 text-sm md:grid-cols-3">
                                                <div>
                                                    <span className="text-gray-500">City: </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {loc.city || "—"}
                                                        {loc.state ? `, ${loc.state}` : ""}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-gray-500">Address: </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {loc.address1 || "—"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-gray-500">Coordinates: </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {typeof loc.latitude === "number" &&
                                                            typeof loc.longitude === "number"
                                                            ? "Saved"
                                                            : "Missing"}
                                                    </span>
                                                </div>
                                            </div>

                                            {loc.description && (
                                                <p className="mt-3 text-sm text-gray-600">
                                                    {loc.description}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                        >
                                            <BarChart3 className="mr-2 h-3.5 w-3.5" />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span> {status || "—"}
                </p>
            </div>
        </div>
    );
}
