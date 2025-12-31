export type Summary = {
    count: number;
    revenue: number;
};

export type DashboardSummary = {
    today: Summary;
    last7Days: Summary;
    allTime: Summary;
};
