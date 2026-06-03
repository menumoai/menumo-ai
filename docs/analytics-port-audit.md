# Analytics Port Audit: `profitpilot` -> `menumo-ai`

## Scope

This tracks the **non-AI analytics and reporting features** that were missing in `menumo-ai` and needed to be ported from `profitpilot`.

Excluded:

- AI recommendations
- AI-generated insights
- "Run analysis" actions

Included:

- sales analytics widgets
- dashboard business-health widgets
- finance/reporting surfaces
- menu performance analytics

## Executive summary

### Ported into `menumo-ai`

1. **Hourly sales heatmap**
2. **Bottom-performing items ranking**
3. **Dashboard avg food cost KPI**
4. **Dashboard waste-risk KPI**
5. **Dashboard top-performers visualization**
6. **Dashboard POS sync banner**
7. **Dashboard richer analytics empty state**
8. **Finance & Taxes page shell**
9. **Menu performance matrix**
10. **Menu item editing + cost capture needed by the matrix**

### Still remaining

1. **Live Firestore-backed finance aggregates**
2. **A first-class inventory-risk model for waste risk**
3. **Optional deeper menu analytics parity beyond the current matrix**

## Feature-by-feature status

| ProfitPilot feature | Menumo-AI implementation | Status | Notes |
|---|---|---|---|
| Sales **hourly sales heatmap** | `src/components/analytics/HourlyHeatmap.tsx`, `src/pages/AnalyticsRevenuePage.tsx` | **Ported** | Derived from Firestore-backed orders and line items through the analytics layer. |
| Sales **Bottom 5 Items** | `src/components/analytics/BottomItemsCard.tsx`, `src/pages/AnalyticsRevenuePage.tsx` | **Ported** | Added alongside the pre-existing top-items analytics. |
| Dashboard **Avg Food Cost** KPI | `src/pages/DashboardPage.tsx` | **Ported** | Derived from existing product cost + sales data. |
| Dashboard **Waste Risk** KPI | `src/pages/DashboardPage.tsx` | **Ported (proxy)** | Currently a derived proxy based on stocked items with no recent sales, not a dedicated inventory-risk domain model. |
| Dashboard **Top Performers** visualization | `src/components/dashboard/TopPerformersCard.tsx`, `src/pages/DashboardPage.tsx` | **Ported** | Added as a dashboard-level performance surface separate from the revenue analytics page. |
| Dashboard **POS connected / synced** banner | `src/pages/DashboardPage.tsx`, `src/models/account.ts` | **Ported** | Uses optional account metadata for POS connection state. |
| Dashboard **empty-state next steps** | `src/pages/DashboardPage.tsx` | **Ported** | Helps steer onboarding toward meaningful analytics data. |
| **Finance & Taxes** page shell | `src/pages/FinanceTaxesPage.tsx`, `src/finance/fixtures.ts`, `src/routes/AppRoutes.tsx`, `src/layout/DashboardLayout.tsx` | **Ported (fixture-backed)** | Matches the approved first-pass scope; not yet backed by live Firestore aggregates. |
| Menu **performance matrix** | `src/components/analytics/MenuPerformanceMatrix.tsx`, `src/analysis/menu.ts`, `src/pages/MenuPage.tsx` | **Ported** | Popularity is derived from sold quantity, profitability from item margin %, and bubble size from revenue. |
| Menu item **edit flow** needed to support analytics upkeep | `src/pages/MenuPage.tsx`, `src/components/menu/AddProductForm.tsx`, `src/services/product.ts` | **Ported** | Editing now persists to Firestore; the form also captures optional item cost so profitability analytics can stay accurate. |

## What did **not** need porting

These were already present or stronger in `menumo-ai`:

1. Revenue trend charts
2. Revenue vs. expenses
3. Revenue by category
4. Channel performance
5. Recent orders analytics
6. Expense analytics page
7. Sales export

## Architecture fit

### Correctly wired to Firestore today

- Revenue analytics additions
- Dashboard business-health additions
- Menu performance matrix
- Menu item editing and cost updates

These all derive from or write to account-scoped Firestore collections such as:

- `accounts/{accountId}/orders`
- `accounts/{accountId}/orders/{orderId}/lineItems`
- `accounts/{accountId}/products`
- `accounts/{accountId}/expenses`

### Intentionally not live yet

- **Finance & Taxes** remains fixture-backed by design for this phase.

## Remaining follow-up

1. Replace finance fixtures with live Firestore-backed period summaries, expense breakdowns, and report rows.
2. Introduce a true inventory/waste model if dashboard waste risk needs full ProfitPilot-style parity.
3. Expand menu analytics only if you want more than the current quadrant matrix and rankings.
