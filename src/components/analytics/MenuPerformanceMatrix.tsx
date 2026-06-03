import {
    Label,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from "recharts";
import type { MenuPerformancePoint } from "../../analysis/types";

const categoryColors: Record<string, string> = {
    appetizer: "#f59e0b",
    entree: "#3b82f6",
    side: "#10b981",
    dessert: "#ec4899",
    beverage: "#8b5cf6",
    special: "#ef4444",
};

function formatCurrencyFromCents(value: number) {
    return (value / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

type TooltipEntry = {
    payload: MenuPerformancePoint;
};

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: TooltipEntry[];
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0].payload;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-lg">
            <p className="font-semibold text-gray-900">{item.name}</p>
            <p className="capitalize text-gray-500">{item.category}</p>
            <div className="mt-2 space-y-1 text-gray-700">
                <p>
                    Popularity: <span className="font-medium">{item.popularity}</span>
                </p>
                <p>
                    Profitability: <span className="font-medium">{item.profitability}</span>
                </p>
                <p>
                    Margin: <span className="font-medium">{item.marginPercent}%</span>
                </p>
                <p>
                    Quantity sold: <span className="font-medium">{item.quantitySold}</span>
                </p>
                <p>
                    Revenue:{" "}
                    <span className="font-medium">
                        {formatCurrencyFromCents(item.revenueCents)}
                    </span>
                </p>
            </div>
        </div>
    );
}

export function MenuPerformanceMatrix({ data }: { data: MenuPerformancePoint[] }) {
    const categories = [...new Set(data.map((item) => item.category))];
    const maxRevenue = Math.max(...data.map((item) => item.revenueCents), 1);

    return (
        <div className="space-y-4">
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 28, right: 24, bottom: 24, left: 12 }}>
                        <XAxis
                            type="number"
                            dataKey="popularity"
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                        >
                            <Label
                                value="Popularity"
                                position="bottom"
                                style={{ fontSize: 12, fill: "#6b7280" }}
                            />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="profitability"
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                        >
                            <Label
                                value="Profitability"
                                angle={-90}
                                position="insideLeft"
                                style={{ fontSize: 12, fill: "#6b7280" }}
                            />
                        </YAxis>
                        <ZAxis
                            type="number"
                            dataKey="revenueCents"
                            range={[80, 500]}
                            domain={[0, maxRevenue]}
                        />

                        <ReferenceLine x={50} stroke="#d1d5db" strokeDasharray="4 4" />
                        <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="4 4" />

                        <ReferenceLine x={25} stroke="transparent">
                            <Label
                                value="Puzzle"
                                position="insideTop"
                                offset={6}
                                style={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                            />
                        </ReferenceLine>
                        <ReferenceLine x={75} stroke="transparent">
                            <Label
                                value="Star"
                                position="insideTop"
                                offset={6}
                                style={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                            />
                        </ReferenceLine>
                        <ReferenceLine x={25} stroke="transparent">
                            <Label
                                value="Dog"
                                position="insideBottom"
                                offset={6}
                                style={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                            />
                        </ReferenceLine>
                        <ReferenceLine x={75} stroke="transparent">
                            <Label
                                value="Plowhorse"
                                position="insideBottom"
                                offset={6}
                                style={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                            />
                        </ReferenceLine>

                        <Tooltip content={<CustomTooltip />} />

                        {categories.map((category) => (
                            <Scatter
                                key={category}
                                name={category}
                                data={data.filter((item) => item.category === category)}
                                fill={categoryColors[category.toLowerCase()] ?? "#14b8a6"}
                                fillOpacity={0.8}
                            />
                        ))}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <span
                        key={category}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor:
                                    categoryColors[category.toLowerCase()] ?? "#14b8a6",
                            }}
                        />
                        {category}
                    </span>
                ))}
            </div>
        </div>
    );
}
