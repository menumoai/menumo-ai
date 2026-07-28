// src/components/finance/UpgradePrompt.tsx
//
// Shown in place of a gated feature. Deliberately not a blank space or a
// disabled control: the owner should be able to see what the plan buys and act
// on it, which is also the only version of a gate that earns anything.

import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { requiredPlanFor, type GatedCapability } from "../../account/entitlements";

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
                See {plan.name} · ${plan.priceMonthly}/mo
            </Link>
        </div>
    );
}
