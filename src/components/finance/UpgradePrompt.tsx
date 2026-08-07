// src/components/finance/UpgradePrompt.tsx
//
// Shown in place of a gated feature. Deliberately not a blank space or a
// disabled control: the owner should be able to see what the plan buys and act
// on it, which is also the only version of a gate that earns anything.

import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { requiredPlanFor, type GatedCapability } from "../../account/entitlements";
import { formatPrice } from "../../config/plans";
import { usePlanCatalog } from "../../hooks/usePlanCatalog";

export function UpgradePrompt({
    capability,
    title,
    children,
}: {
    capability: GatedCapability;
    title: string;
    children: React.ReactNode;
}) {
    const plan = requiredPlanFor(capability);
    const { plans, loading } = usePlanCatalog();

    // The live monthly price, when there is one to quote. Absent while the
    // catalog loads, and absent for good if that plan is no longer sold - in
    // which case the button still points at the plans page, because the honest
    // answer to "what does this cost" is on that page rather than guessable
    // from a constant this build shipped with.
    const live = plans.find((p) => p.id === plan.id) ?? null;
    const price = loading ? null : live?.priceMonthly ?? null;

    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
                <Lock className="h-5 w-5" />
            </span>

            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{children}</p>

            <Link
                to="/get-started"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
                See {live?.name ?? plan.name}
                {price !== null && ` · ${formatPrice(price)}/mo`}
            </Link>
        </div>
    );
}
