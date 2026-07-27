// src/components/onboarding/BetaStrip.tsx
//
// The honesty contract. Sits above everything else on /get-started, before any
// promise is made. Not dismissible on this page - it is the point of the page.

export function BetaStrip({ onSeeStatus }: { onSeeStatus?: () => void }) {
    return (
        <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 text-sm text-amber-900 sm:px-6 lg:px-8">
                <span className="font-semibold">Menumo is in open beta.</span>
                <span className="text-amber-800">
                    Everything marked live below works today. We list what does not, too.
                </span>
                {onSeeStatus && (
                    <button
                        type="button"
                        onClick={onSeeStatus}
                        className="ml-auto rounded-full px-2 py-0.5 font-semibold underline underline-offset-2 hover:bg-amber-100"
                    >
                        See what&rsquo;s live
                    </button>
                )}
            </div>
        </div>
    );
}
