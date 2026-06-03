# Menumo AI Architecture

This document describes the current structure of the `menumo-ai/` app.

## Stack

- Vite 7
- React 19
- React Router 7
- Firebase Auth
- Firestore
- Tailwind CSS 4

## App shell

The root app wiring lives in `src/App.tsx`:

```text
AuthProvider -> AccountProvider -> BrowserRouter -> AppShell -> AppRoutes
```

That split is important:

- `AuthProvider` owns Firebase auth state and user profile loading.
- `AccountProvider` resolves the current business account context separately from auth.
- `AppShell` decides whether to render a public page directly or wrap the page in the authenticated dashboard layout.
- `AppRoutes` maps URL paths to pages and applies route guards.

## Routing

Routes are defined in `src/routes/AppRoutes.tsx`.

- Public routes:
  - `/`
  - `/auth`
- Business routes:
  - `/dashboard`
  - `/analytics/revenue`
  - `/menu`
  - `/orders`
  - `/orders/new`
  - `/orders/:orderId`
  - `/expenses`
  - `/locations`
  - `/dev`

Protected app pages are wrapped in `BusinessRoute` from `src/routes/RouteGuards.tsx`, which composes:

```text
RequireAuth -> RequireBusiness
```

That means a user must be signed in **and** have a resolved business account before reaching the main app surfaces.

## Auth and account model

Auth and business context are intentionally separate concerns.

### `src/auth/AuthContext.tsx`

This provider listens to Firebase Auth with `onAuthStateChanged()` and exposes:

- `user`
- `profile`
- `loading`
- `profileLoading`
- `logout()`
- convenience flags like `isCustomer`, `isBusinessOwner`, and `isStaff`

The profile is loaded from the profile service after auth resolves.

### `src/account/AccountContext.tsx`

This provider derives the active business account from:

1. `profile.primaryAccountId` when present
2. otherwise `user.uid`

It then subscribes to the Firestore account document and exposes:

- `accountId`
- `account`
- `loading`
- `role`
- `isBusiness`

Use:

- `useAuth()` for user identity/profile concerns
- `useAccount()` for current business account context

Do not collapse these into a single context unless the app architecture changes on purpose.

## Layout structure

`src/layout/AppShell.tsx` is the main app shell switch.

- Public paths (`/`, `/auth`) render without the dashboard chrome.
- All other pages render inside `DashboardLayout`.
- The demo AI prototype companion is mounted here so it appears across authenticated pages.

`src/layout/DashboardLayout.tsx` owns:

- top navigation
- sidebar navigation
- notifications UI
- account menu UI
- page chrome for authenticated business pages

## Data flow

The app is client-heavy and talks directly to Firebase services.

The common flow is:

```text
Firestore/Auth -> services -> hooks/selectors/analysis -> pages/components
```

### Services

Service modules in `src/services/*.ts` are the main data-access layer. They wrap Firestore collections and document operations for a single domain.

Examples:

- `src/services/order.ts`
- `src/services/product.ts`
- `src/services/expense.ts`
- `src/services/customer.ts`
- `src/services/location.ts`
- `src/services/accounts.ts`
- `src/services/profile.ts`

These services usually read and write under account-scoped paths like:

```text
accounts/{accountId}/orders
accounts/{accountId}/orders/{orderId}/lineItems
accounts/{accountId}/products
accounts/{accountId}/expenses
```

When adding new business data, keep it account-scoped under `accounts/{accountId}/...` unless there is a deliberate reason to make it global/public.

### Hooks

Hooks layer UI state on top of services.

Examples:

- `src/hooks/useAnalyticsSnapshot.ts`
- `src/hooks/useExpense.ts`
- `src/hooks/useMenuProducts.ts`
- `src/hooks/useOrderDetail.ts`
- `src/dashboard/useDashboardOrders.ts`

Hooks typically own:

- loading state
- error state
- status text
- reload/refetch behavior

Pages should prefer hooks over calling Firestore directly.

### Analysis and selectors

Derived business metrics live outside raw service modules.

- `src/analysis/*` computes revenue and dashboard analytics from loaded snapshots.
- `src/orders/*` and `src/dashboard/*` contain selectors and view-specific helpers.

Example:

`useAnalyticsSnapshot()` loads orders, products, line items, and expenses, then `src/analysis/revenue.ts` computes dashboard-ready metrics from that snapshot.

## Pages and components

Pages live in `src/pages/` and should stay focused on screen composition, route params, and hook orchestration.

Components live in `src/components/` and are split broadly by domain:

- `components/dashboard/*`
- `components/orders/*`
- `components/menu/*`
- `components/auth/*`
- `components/ui/*`
- `components/ai/*`

Prefer:

- page -> hook/service orchestration
- component -> presentation and local interaction

Avoid putting broad Firestore query logic directly into page components.

## UI primitives

Reusable UI building blocks live in `src/components/ui/*`.

Feature code should prefer these wrappers rather than reintroducing raw Radix primitives or ad-hoc patterns in each page.

## Firebase bootstrap

`src/firebaseClient.ts` initializes:

- Firebase app
- Firestore
- Firebase Auth
- Google auth provider

Environment variables are read with `import.meta.env`, for example:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Any new client-side configuration should follow the same Vite env pattern.

## Current AI surface

The current AI prototype surface is intentionally lightweight:

- `src/components/ai/AiCompanion.tsx`

Right now it is:

- client-side only
- demo-backed
- route-aware
- mounted from `AppShell`
- enabled in dev or when `VITE_AI_COMPANION_DEMO=true`

It does **not** currently depend on a backend AI pipeline or Firebase persistence.

## Conventions

When adding or changing features, follow these rules:

1. Keep auth state and business account state separate.
2. Scope Firestore business data under `accounts/{accountId}/...`.
3. Put Firestore calls in `src/services/*`, not directly in page components.
4. Use hooks to translate raw service calls into UI-friendly state.
5. Keep pages thin; put reusable UI into components.
6. Put derived analytics logic in `src/analysis/*` or domain selector modules.
7. Mount cross-app UI in `AppShell` or `DashboardLayout`, not ad hoc in individual pages.

## Folder map

```text
menumo-ai/
├── docs/
│   └── architecture.md
├── src/
│   ├── account/          # business account context
│   ├── analysis/         # derived analytics and helpers
│   ├── auth/             # auth context and auth-related wiring
│   ├── components/       # feature UI + shared ui primitives
│   ├── dashboard/        # dashboard-specific selectors/hooks
│   ├── hooks/            # reusable client hooks
│   ├── layout/           # AppShell and DashboardLayout
│   ├── models/           # shared domain types
│   ├── orders/           # order selectors and helpers
│   ├── pages/            # route-level screens
│   ├── routes/           # route table and guards
│   ├── services/         # Firestore/Auth data access
│   ├── App.tsx
│   └── firebaseClient.ts
└── package.json
```
