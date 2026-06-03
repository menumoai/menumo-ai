import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface TopPerformerSlice {
    [key: string]: string | number;
    name: string;
    value: number;
    color: string;
}

function formatPercent(value: number) {
    return `${value.toFixed(0)}%`;
}

export function TopPerformersCard({
    data,
}: {
    data: TopPerformerSlice[];
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Top Performers
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Revenue share for your best-selling items this month.
                </p>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-gray-500">No menu performance data yet.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-3">
                        {data.map((item) => (
                            <div key={item.name}>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {formatPercent(item.value)}
                                    </span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-100">
                                    <div
                                        className="h-3 rounded-full transition-all"
                                        style={{
                                            width: `${item.value}%`,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={48}
                                    dataKey="value"
                                    label={({ percent }) =>
                                        `${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {data.map((item) => (
                                        <Cell key={item.name} fill={item.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [
                                        `${Number(value).toFixed(0)}%`,
                                        "Revenue share",
                                    ]}
                                    contentStyle={{
                                        background: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 12,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
