// src/pages/GetStartedPage.tsx
//
// One route, two states, either side of the signup line.
//
//   visitor   - public brief reached from the home page's "Let's get started"
//               button. Explains the product, publishes the honest beta status,
//               shows the plans, and previews the five setup steps.
//   signed in - the same content, personalized, with the checklist ticked from
//               real account data.
//
// The shell swap is handled in layout/AppShell.tsx: this route renders bare for
// visitors and inside DashboardLayout once there is an account.

import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import { markOnboardingComplete } from "../services/accounts";
import { LIVE_FEATURES } from "../config/features";
import { TRIAL_DAYS, TRIAL_PLAN, isPlanId, type PlanId } from "../config/plans";
import { resolvePlan } from "../account/entitlements";
import {
    PREVIEW_STEPS,
    useOnboardingProgress,
} from "../hooks/useOnboardingProgress";
import { greetingFirstName, useAccountUser } from "../hooks/useAccountUser";
import { BetaStrip } from "../components/onboarding/BetaStrip";
import { SetupChecklist } from "../components/onboarding/SetupChecklist";
import { FeatureGrid } from "../components/onboarding/FeatureGrid";
import { BetaStatusBoard } from "../components/onboarding/BetaStatusBoard";
import {
    CapabilityMatrix,
    PlanCards,
    TRIAL_BLURB,
} from "../components/onboarding/PlanCards";

export function GetStartedPage() {
    const { user } = useAuth();
    const { account, accountId } = useAccount();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const signedIn = Boolean(user && account);
    const plansRef = useRef<HTMLDivElement | null>(null);
    const statusRef = useRef<HTMLDivElement | null>(null);

    const { steps, completed, total, allDone } = useOnboardingProgress(
        signedIn ? accountId : null,
    );

    const requestedPlan = params.get("plan");
    const highlightPlan: PlanId = isPlanId(requestedPlan)
        ? requestedPlan
        : TRIAL_PLAN;

    // Write the terminal flag once. AccountContext is on a live onSnapshot, so
    // the sidebar and redirect rules react without a refresh.
    useEffect(() => {
        if (!signedIn || !accountId || !allDone) return;
        if (account?.onboardingCompletedAt) return;

        void markOnboardingComplete(accountId).catch((err) => {
            console.error("Failed to mark onboarding complete", err);
        });
    }, [signedIn, accountId, allDone, account?.onboardingCompletedAt]);

    // The real name the owner typed at signup, never a guess from their email.
    const { accountUser } = useAccountUser(
        signedIn ? accountId : null,
        user?.uid,
    );
    const firstName = greetingFirstName(accountUser, user?.displayName);

    // Signed out this is a signup funnel; signed in the same click belongs on
    // /billing, which owns checkout. Sending both from here would duplicate the
    // Stripe call at a second site for no benefit.
    const choosePlan = (planId: PlanId) => {
        navigate(
            signedIn ? "/billing" : `/auth?plan=${planId}&from=get-started`,
        );
    };

    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div className={signedIn ? "" : "min-h-screen bg-[#FBF8F3]"}>
            {!signedIn && <PublicNav />}

            <BetaStrip onSeeStatus={() => scrollTo(statusRef)} />

            <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
                {/* ------------------------------------------------ hero */}
                <header className="flex flex-wrap items-start gap-6 py-10">
                    <div className="min-w-[280px] flex-1">
                        <h1
                            className="text-3xl leading-tight tracking-tight text-gray-900 sm:text-4xl"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            {signedIn
                                ? `Welcome to Menumo${firstName ? `, ${firstName}` : ""}.`
                                : "Here's exactly what you're getting."}
                        </h1>

                        <p className="mt-3 max-w-xl text-gray-600">
                            {signedIn ? (
                                <>
                                    Let&rsquo;s get{" "}
                                    <span className="font-medium text-gray-900">
                                        {account?.name ?? "your truck"}
                                    </span>{" "}
                                    earning its keep. Five short steps, about ten minutes
                                    total, and your dashboard starts telling you things you
                                    did not know.
                                </>
                            ) : (
                                <>
                                    Menumo runs the money side of a food truck: what each
                                    dish really costs, what sold, what got thrown away, and
                                    what that leaves you at the end of the week. Read this
                                    in two minutes, then start a {TRIAL_DAYS}-day trial.
                                </>
                            )}
                        </p>

                        {!signedIn && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => choosePlan(highlightPlan)}
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                                >
                                    Start free trial
                                    <Sparkles className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollTo(plansRef)}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white"
                                >
                                    See the plans
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-[#4A7C70]">
                            {signedIn ? "Pro trial" : TRIAL_BLURB}
                        </span>
                        {signedIn && (
                            <span className="text-xs text-gray-500">No card on file</span>
                        )}
                    </div>
                </header>

                {/* ------------------------------------------- checklist */}
                <section className="mt-2">
                    {signedIn && allDone ? (
                        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A7C70] text-white">
                                <Check className="h-5 w-5" />
                            </span>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    You&rsquo;re set up.
                                </p>
                                <p className="text-sm text-gray-600">
                                    All {total} steps done. Your numbers are live.
                                </p>
                            </div>
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 rounded-full bg-[#4A7C70] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                            >
                                Go to dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <SetupChecklist
                            steps={signedIn ? steps : PREVIEW_STEPS}
                            preview={!signedIn}
                            completed={completed}
                        />
                    )}
                </section>

                {/* --------------------------------------------- features */}
                <SectionTitle
                    title={signedIn ? "What you can do today" : "What you get"}
                    caption={`${LIVE_FEATURES.length} features, all live right now`}
                />
                <FeatureGrid features={LIVE_FEATURES} linkToRoutes={signedIn} />

                {/* ----------------------------------------- beta status */}
                <div ref={statusRef}>
                    <SectionTitle
                        title="Where Menumo honestly stands"
                        caption="Updated as things ship. No dates promised."
                    />
                    <BetaStatusBoard />
                </div>

                {/* ----------------------------------------------- plans */}
                <div ref={plansRef}>
                    <SectionTitle
                        title={signedIn ? "Plans, when your trial ends" : "Plans"}
                        caption={
                            signedIn
                                ? "Pick any time. Nothing changes until your trial is up."
                                : "Every trial starts on Pro. Choose a plan later."
                        }
                    />
                    <PlanCards
                        signedIn={signedIn}
                        /* Read off the account rather than assumed. This used to
                           hardcode TRIAL_PLAN because subscriptionTier's legacy
                           enum did not map to a PlanId; resolvePlan now handles
                           that, and prefers the Stripe-written plan when there
                           is one, so a paying owner sees what they actually pay
                           for instead of everyone seeing "Pro". */
                        currentPlan={signedIn ? resolvePlan(account) : null}
                        onChoose={choosePlan}
                    />

                    <div className="mt-4">
                        <CapabilityMatrix />
                    </div>
                </div>

                {/* The beta feedback block belongs here, but it is deliberately
                    not shipped: there is no real support destination yet. A
                    "we reply the same day" promise with a dead mailto behind it
                    is worse than no promise. Restore it once there is either a
                    monitored inbox or a supportTickets collection to write to. */}
            </div>
        </div>
    );
}

function SectionTitle({ title, caption }: { title: string; caption: string }) {
    return (
        <div className="mb-3 mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2
                className="text-xl tracking-tight text-gray-900"
                style={{ fontFamily: "Poppins, sans-serif" }}
            >
                {title}
            </h2>
            <p className="text-sm text-gray-500">{caption}</p>
        </div>
    );
}

/** Landing-style nav, so the public state does not look like a logged-out app. */
function PublicNav() {
    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <img
                        src="/menumo-logo.png"
                        alt="Menumo"
                        className="h-10 w-10 rounded-lg object-cover"
                    />
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        to="/auth"
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/auth?from=get-started"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                    >
                        Start free trial
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default GetStartedPage;
