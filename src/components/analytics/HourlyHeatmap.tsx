import { Fragment, useMemo, useState } from "react";
import type { HourlyRevenueBucket } from "../../analysis/types";

interface HourlyHeatmapProps {
    data: HourlyRevenueBucket[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, index) => index + 9);

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

function getHourLabel(hour: number): string {
    if (hour === 0) return "12a";
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return "12p";
    return `${hour - 12}p`;
}

function getColor(value: number, max: number): string {
    if (max === 0 || value === 0) return "#F3F4F6";

    const ratio = value / max;
    if (ratio < 0.2) return "#CCFBF1";
    if (ratio < 0.4) return "#99F6E4";
    if (ratio < 0.6) return "#5EEAD4";
    if (ratio < 0.8) return "#2DD4BF";
    return "#0F766E";
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
    const [tooltip, setTooltip] = useState<{
        day: string;
        hour: string;
        revenueCents: number;
        orderCount: number;
        x: number;
        y: number;
    } | null>(null);

    const { bucketMap, maxRevenueCents } = useMemo(() => {
        const map = new Map<string, HourlyRevenueBucket>();
        let max = 0;

        for (const bucket of data) {
            const key = `${bucket.dayOfWeek}-${bucket.hour}`;
            map.set(key, bucket);

            if (bucket.revenueCents > max) {
                max = bucket.revenueCents;
            }
        }

        return { bucketMap: map, maxRevenueCents: max };
    }, [data]);

    return (
        <div className="relative overflow-x-auto">
            <div
                className="inline-grid gap-1"
                style={{ gridTemplateColumns: `48px repeat(${HOURS.length}, minmax(32px, 1fr))` }}
            >
                <div />
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="px-1 pb-1 text-center text-xs text-gray-500"
                    >
                        {getHourLabel(hour)}
                    </div>
                ))}

                {DAY_LABELS.map((day, dayIndex) => (
                    <Fragment key={day}>
                        <div className="flex items-center pr-2 text-xs font-medium text-gray-500">
                            {day}
                        </div>
                        {HOURS.map((hour) => {
                            const bucket = bucketMap.get(`${dayIndex}-${hour}`);
                            const revenueCents = bucket?.revenueCents ?? 0;
                            const orderCount = bucket?.orderCount ?? 0;

                            return (
                                <div
                                    key={`${dayIndex}-${hour}`}
                                    className="h-7 w-8 cursor-pointer rounded-sm transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: getColor(
                                            revenueCents,
                                            maxRevenueCents,
                                        ),
                                    }}
                                    onMouseEnter={(event) => {
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        setTooltip({
                                            day,
                                            hour: getHourLabel(hour),
                                            revenueCents,
                                            orderCount,
                                            x: rect.left + rect.width / 2,
                                            y: rect.top,
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            );
                        })}
                    </Fragment>
                ))}
            </div>

            {tooltip && (
                <div
                    className="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <p className="font-medium">
                        {tooltip.day} {tooltip.hour}
                    </p>
                    <p>{formatMoney(tooltip.revenueCents)}</p>
                    <p className="text-gray-300">{tooltip.orderCount} orders</p>
                </div>
            )}
        </div>
    );
}
