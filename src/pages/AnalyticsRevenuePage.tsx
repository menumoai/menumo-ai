import { Button } from '../components/ui/button';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Download,
    Calendar,
    Sparkles,
    Target,
    PieChart
} from 'lucide-react';

export function AnalyticsRevenuePage() {
    const revenueInsights = [
        {
            title: 'Peak Revenue Time',
            value: '12:15 PM - 1:30 PM',
            insight: 'Accounts for 42% of daily sales',
            icon: TrendingUp,
            color: 'green'
        },
        {
            title: 'Top Selling Item',
            value: 'Classic Street Taco',
            insight: '34% of all orders include this',
            icon: Target,
            color: 'blue'
        },
        {
            title: 'Best Day',
            value: 'Saturday',
            insight: '35% higher than weekday average',
            icon: Calendar,
            color: 'purple'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#5B9A8B] to-[#4A7C70] rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Analytics & Revenue
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Understand performance and maximize profitability
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-green-50 border-2 border-teal-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Revenue Optimization Insights
                        </h2>
                        <p className="text-sm text-gray-600">AI-powered recommendations to boost revenue</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {revenueInsights.map((insight, idx) => {
                        const Icon = insight.icon;
                        return (
                            <div key={idx} className="bg-white border border-teal-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-5 h-5 text-${insight.color}-600`} />
                                    <h3 className="font-semibold text-gray-700 text-sm">{insight.title}</h3>
                                </div>
                                <div className="text-xl font-bold text-gray-900 mb-1">{insight.value}</div>
                                <p className="text-xs text-gray-600">{insight.insight}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">$18,450</div>
                    <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Order Value</span>
                        <BarChart3 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">$14.25</div>
                    <div className="text-xs text-gray-500 mt-1">+$1.50 vs last month</div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Orders</span>
                        <PieChart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">1,295</div>
                    <div className="text-xs text-green-600 mt-1">+8% vs last month</div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Gross Margin</span>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">62%</div>
                    <div className="text-xs text-gray-500 mt-1">+2% vs last month</div>
                </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Revenue by Category
                </h3>
                <div className="space-y-4">
                    {[
                        { category: 'Tacos', revenue: 7380, percentage: 40, color: 'bg-orange-500' },
                        { category: 'Burritos', revenue: 5535, percentage: 30, color: 'bg-teal-500' },
                        { category: 'Bowls', revenue: 3690, percentage: 20, color: 'bg-purple-500' },
                        { category: 'Drinks & Sides', revenue: 1845, percentage: 10, color: 'bg-blue-500' }
                    ].map((cat, idx) => (
                        <div key={idx}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{cat.category}</span>
                                <span className="text-sm font-semibold text-gray-900">${cat.revenue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`${cat.color} h-3 rounded-full transition-all`}
                                    style={{ width: `${cat.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
