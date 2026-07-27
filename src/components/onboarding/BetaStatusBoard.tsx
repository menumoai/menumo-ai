// src/components/onboarding/BetaStatusBoard.tsx
//
// Three columns, no spin. Publishing the unbuilt column is what makes the "live"
// column believable, so nothing here is allowed to soften: no dates, no
// "coming soon" on things nobody has started.

import {
    BUILDING_FEATURES,
    LIVE_FEATURES,
    PLANNED_FEATURES,
    type Feature,
} from "../../config/features";

interface Column {
    key: string;
    title: string;
    caption: string;
    dot: string;
    text: string;
    items: readonly Feature[];
}

const COLUMNS: Column[] = [
    {
        key: "live",
        title: "Live today",
        caption: "Working right now, in your account",
        dot: "bg-[#4A7C70]",
        text: "text-[#4A7C70]",
        items: LIVE_FEATURES,
    },
    {
        key: "building",
        title: "Being built now",
        caption: "Real code exists, not finished",
        dot: "bg-amber-500",
        text: "text-amber-700",
        items: BUILDING_FEATURES,
    },
    {
        key: "planned",
        title: "Planned, not started",
        caption: "On the roadmap, no date promised",
        dot: "bg-gray-400",
        text: "text-gray-500",
        items: PLANNED_FEATURES,
    },
];

export function BetaStatusBoard() {
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {COLUMNS.map((col) => (
                <section
                    key={col.key}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                >
                    <h3
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${col.text}`}
                    >
                        <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${col.dot}`}
                        />
                        {col.title}
                        <span className="ml-auto font-mono text-[11px] font-medium tabular-nums text-gray-400">
                            {col.items.length}
                        </span>
                    </h3>
                    <p className="mt-1 text-[11px] text-gray-400">{col.caption}</p>

                    <ul className="mt-3 space-y-1.5">
                        {col.items.map((f) => (
                            <li
                                key={f.id}
                                className="flex gap-2 text-sm leading-snug text-gray-600"
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gray-300"
                                />
                                {f.name}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
