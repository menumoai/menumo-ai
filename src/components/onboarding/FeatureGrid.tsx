// src/components/onboarding/FeatureGrid.tsx
//
// The "what you can do today" grid. Reads the live slice of the feature catalog
// so it can never claim something that config/features.ts does not back.

import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import type { Feature } from "../../config/features";
import { getPlan, planCovers } from "../../config/plans";
import { FLOOR_PLAN } from "../../account/entitlements";
import { featureIcon } from "./featureIcons";

interface Props {
    features: readonly Feature[];
    /** Signed-out visitors get no in-app links. */
    linkToRoutes?: boolean;
}

export function FeatureGrid({ features, linkToRoutes = false }: Props) {
    return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
                const Icon = featureIcon(feature.icon);
                // Gated means "costs more than everyone already has", so it is
                // asked of the floor rather than named plan by plan. When
                // Essentials was withdrawn the floor became Pro, and this
                // stopped being a list of tier names that has to be edited in
                // step with the catalog.
                const gated =
                    feature.minPlan !== null &&
                    !planCovers(FLOOR_PLAN, feature.minPlan);
                const opensHere = linkToRoutes && Boolean(feature.route);

                const body = (
                    <>
                        <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#4A7C70]">
                            <Icon className="h-4 w-4" />
                        </span>
                        <span className="block text-sm font-semibold text-gray-900">
                            {feature.name}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                            {feature.blurb}
                        </span>
                        {/* The route belongs in the link target, never in the
                            copy. Nobody navigates this app by typing a URL, so
                            printing "/analytics/revenue" was leaking an
                            implementation detail into user-facing text. */}
                        <span className="mt-2.5 flex items-center gap-2">
                            {gated && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-[#4A7C70]">
                                    <Lock className="h-2.5 w-2.5" />
                                    {getPlan(feature.minPlan!).name} and up
                                </span>
                            )}
                            {opensHere && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A7C70]">
                                    Open
                                    <ArrowRight className="h-3 w-3" />
                                </span>
                            )}
                        </span>
                    </>
                );

                return (
                    <li key={feature.id}>
                        {linkToRoutes && feature.route ? (
                            <Link
                                to={feature.route}
                                className="block h-full rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#5B9A8B] hover:shadow-sm"
                            >
                                {body}
                            </Link>
                        ) : (
                            <div className="h-full rounded-xl border border-gray-200 bg-white p-4">
                                {body}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
