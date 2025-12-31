import type { DashboardSummary } from "../../dashboard/dashboardTypes";

type SummaryCardProps = {
    title: string;
    subtitle: string;
    count: number;
    revenue: number;
};

function SummaryCard({ title, subtitle, count, revenue }: SummaryCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {title}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
            </p>

            <div className="mt-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Orders
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {count}
                </p>

                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Revenue
                </p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    ${revenue.toFixed(2)}
                </p>
            </div>
        </div>
    );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
    const { today, last7Days, allTime } = summary;

    return (
        <section className="mb-8 grid gap-4 md:grid-cols-3">
            <SummaryCard
                title="Today"
                subtitle="Orders placed since midnight."
                count={today.count}
                revenue={today.revenue}
            />
            <SummaryCard
                title="Last 7 Days"
                subtitle="Rolling week, including today."
                count={last7Days.count}
                revenue={last7Days.revenue}
            />
            <SummaryCard
                title="All Time"
                subtitle="Since this account started using Menumo."
                count={allTime.count}
                revenue={allTime.revenue}
            />
        </section>
    );
}
