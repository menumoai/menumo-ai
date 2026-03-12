import type { LucideIcon } from "lucide-react";
import {
    Calendar,
    DollarSign,
    Package,
    TrendingUp,
} from "lucide-react";
import type { DashboardSummary } from "../../dashboard/dashboardTypes";

type SummaryCardProps = {
    title: string;
    subtitle: string;
    count: number;
    revenue: number;
    icon: LucideIcon;
    iconWrapperClassName: string;
    iconClassName: string;
};

function formatCurrency(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

function SummaryCard({
    title,
    subtitle,
    count,
    revenue,
    icon: Icon,
    iconWrapperClassName,
    iconClassName,
}: SummaryCardProps) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconWrapperClassName}`}>
                    <Icon className={`h-5 w-5 ${iconClassName}`} />
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Active
                </span>
            </div>

            <div className="mb-4">
                <h2
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    {title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>

                <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(revenue)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
    const { today, last7Days, allTime } = summary;

    return (
        <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
                title="Today"
                subtitle="Orders placed since midnight."
                count={today.count}
                revenue={today.revenue}
                icon={Calendar}
                iconWrapperClassName="bg-gradient-to-br from-blue-100 to-blue-200"
                iconClassName="text-blue-700"
            />

            <SummaryCard
                title="Last 7 Days"
                subtitle="Rolling week, including today."
                count={last7Days.count}
                revenue={last7Days.revenue}
                icon={Package}
                iconWrapperClassName="bg-gradient-to-br from-orange-100 to-orange-200"
                iconClassName="text-orange-700"
            />

            <SummaryCard
                title="All Time"
                subtitle="Since this account started using Menumo."
                count={allTime.count}
                revenue={allTime.revenue}
                icon={DollarSign}
                iconWrapperClassName="bg-gradient-to-br from-green-100 to-green-200"
                iconClassName="text-green-700"
            />
        </section>
    );
}
