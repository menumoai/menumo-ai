type RevenueMetric = {
    label: string;
    value: string;
    detail: string;
};

function MetricCard({ label, value, detail }: RevenueMetric) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
            <div className="mt-1 text-xs text-gray-500">{detail}</div>
        </div>
    );
}

export function RevenueMetricGrid({ metrics }: { metrics: RevenueMetric[] }) {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
            ))}
        </section>
    );
}
