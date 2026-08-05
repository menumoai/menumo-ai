// Creates or updates the Menumo subscription products and their monthly and
// annual prices in Stripe, from `src/config/plans.ts`.
//
//   node scripts/stripe-seed-products.mjs                    # dry run
//   node scripts/stripe-seed-products.mjs --apply            # write to Stripe
//   node scripts/stripe-seed-products.mjs --apply --migrate-prices
//                                       # also re-point changed amounts
//
// Replaces an earlier shell version that restated the names, prices and blurbs
// in a second place. Node 24 strips TypeScript types on import, so this reads
// plans.ts directly and there is nothing left to keep in step by hand: change a
// price or a highlight there, re-run this, and Stripe follows.
//
// Test or live mode is decided by STRIPE_SECRET_KEY, not by a flag, because the
// key already determines which account is touched - a flag that disagreed with
// the key would be a trap. Live runs demand an extra confirmation.
//
// Safe to re-run. Products are updated in place; prices are immutable in Stripe,
// so a changed amount is reported rather than silently re-pointed.
//
// --migrate-prices is the deliberate way through that report. It creates the new
// price and transfers the lookup key onto it, so new checkouts get the new
// amount while everyone already subscribed stays on the price they agreed to
// until they change plan themselves. That is the honest behaviour, but it is
// still a price change, so it never happens without being asked for.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import Stripe from "stripe";
import {
    BILLING_INTERVALS,
    PLANS,
    priceFor,
    stripeLookupKey,
} from "../src/config/plans.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const MIGRATE = process.argv.includes("--migrate-prices");

/** Reads .env.local so this behaves like the dev server without extra setup. */
function envFromFile() {
    try {
        const text = readFileSync(resolve(ROOT, ".env.local"), "utf8");
        return Object.fromEntries(
            text
                .split("\n")
                .map((line) => /^([A-Za-z0-9_]+)=(.*)$/.exec(line.trim()))
                .filter(Boolean)
                .map((m) => [m[1], m[2]]),
        );
    } catch {
        return {};
    }
}

const key = process.env.STRIPE_SECRET_KEY ?? envFromFile().STRIPE_SECRET_KEY;
if (!key) {
    console.error("STRIPE_SECRET_KEY is not set (checked env and .env.local).");
    process.exit(1);
}

const isLive = key.includes("_live_");
const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });

const productId = (planId) => `menumo_${planId}`;

/** Stripe's own name for an interval. Ours reads better in a UI; this bills. */
const recurring = (interval) => ({
    interval: interval === "annual" ? "year" : "month",
});

/**
 * What a product should look like, derived entirely from plans.ts.
 *
 * `marketing_features` are the bullets Stripe shows on Checkout and pricing
 * tables. They are display-only - nothing gates on them - so they come straight
 * from the same `highlights` the app's own pricing cards render. Stripe caps
 * them at 15 items of 80 characters.
 */
function desiredProduct(plan) {
    const features = plan.highlights.slice(0, 15).map((name) => {
        if (name.length > 80) {
            console.warn(`  ! highlight over 80 chars, truncated: "${name}"`);
            return { name: `${name.slice(0, 77)}...` };
        }
        return { name };
    });

    return {
        name: `Menumo ${plan.name}`,
        description: plan.tagline,
        marketing_features: features,
        metadata: { plan_id: plan.id },
    };
}

/** Stripe returns null for an unset description; normalise for comparison. */
function productDiffers(existing, desired) {
    if (existing.name !== desired.name) return true;
    if ((existing.description ?? "") !== desired.description) return true;
    if (existing.metadata?.plan_id !== desired.metadata.plan_id) return true;

    const before = (existing.marketing_features ?? []).map((f) => f.name);
    const after = desired.marketing_features.map((f) => f.name);
    return before.length !== after.length ||
        before.some((name, i) => name !== after[i]);
}

async function findProduct(id) {
    try {
        return await stripe.products.retrieve(id);
    } catch (error) {
        if (error.code === "resource_missing") return null;
        throw error;
    }
}

/** One plan at one interval. Returns false if it needs a human decision. */
async function syncPrice(plan, interval) {
    const id = productId(plan.id);
    const key = stripeLookupKey(plan.id, interval);
    const amount = priceFor(plan, interval);
    const cents = Math.round(amount * 100);
    const unit = interval === "annual" ? "yr" : "mo";

    const found = await stripe.prices.list({
        lookup_keys: [key],
        active: true,
        limit: 1,
    });
    const price = found.data[0];

    if (!price) {
        console.log(`  price ${key}: CREATE at $${amount}/${unit}`);
        if (APPLY) {
            await stripe.prices.create({
                product: id,
                currency: "usd",
                unit_amount: cents,
                recurring: recurring(interval),
                lookup_key: key,
                // `plan_id` is what the webhook reads to decide entitlements;
                // `billing_interval` is only ever a label, because the app
                // reads the cadence off `recurring.interval` instead.
                metadata: { plan_id: plan.id, billing_interval: interval },
            });
        }
        return true;
    }

    if (price.unit_amount === cents) {
        console.log(`  price ${key}: up to date ($${amount}/${unit})`);
        return true;
    }

    const was = (price.unit_amount / 100).toFixed(2);

    if (!MIGRATE) {
        // Stripe prices are immutable. Re-pointing the lookup key by default
        // would change what new customers pay as a side effect of a re-run, so
        // this stops and makes it a decision instead.
        console.error(
            `  price ${key}: MISMATCH - Stripe has $${was}, plans.ts says $${amount}.`,
        );
        console.error(
            `    Prices cannot be edited. Re-run with --migrate-prices to mint ` +
                `the new price and move the lookup key onto it; existing ` +
                `subscribers stay on $${was} until they change plan.`,
        );
        return false;
    }

    console.log(
        `  price ${key}: MIGRATE $${was} -> $${amount}/${unit} ` +
            `(new price, lookup key transferred; ${price.id} left for existing subscribers)`,
    );
    if (APPLY) {
        await stripe.prices.create({
            product: id,
            currency: "usd",
            unit_amount: cents,
            recurring: recurring(interval),
            lookup_key: key,
            // Moves the key off the old price rather than colliding with it.
            // The old price stays active and keeps billing whoever is on it.
            transfer_lookup_key: true,
            metadata: { plan_id: plan.id, billing_interval: interval },
        });
    }
    return true;
}

async function syncPlan(plan) {
    const id = productId(plan.id);
    const desired = desiredProduct(plan);

    console.log(
        `\n${plan.name}  ($${plan.priceMonthly}/mo, $${plan.priceAnnual}/yr)`,
    );

    const existing = await findProduct(id);
    if (!existing) {
        console.log(`  product ${id}: CREATE`);
        desired.marketing_features.forEach((f) => console.log(`    + ${f.name}`));
        if (APPLY) await stripe.products.create({ id, ...desired });
    } else if (productDiffers(existing, desired)) {
        console.log(`  product ${id}: UPDATE`);
        desired.marketing_features.forEach((f) => console.log(`    - ${f.name}`));
        if (APPLY) await stripe.products.update(id, desired);
    } else {
        console.log(`  product ${id}: up to date`);
    }

    let ok = true;
    for (const interval of BILLING_INTERVALS) {
        // Sequential, not Promise.all: both prices hang off the product created
        // just above, and interleaving them makes the log unreadable for no
        // meaningful gain on six prices.
        ok = (await syncPrice(plan, interval)) && ok;
    }
    return ok;
}

/**
 * The account label, when the key is allowed to ask for it.
 *
 * Retrieving the account needs `accounts_kyc_basic_read`, which a properly
 * least-privileged restricted key has no reason to carry - and this is only
 * cosmetic, so refusing to run without it would be the script demanding a
 * permission it does not need. The mode below is what actually matters, and
 * that comes from the key prefix.
 */
async function accountLabel() {
    try {
        const account = await stripe.accounts.retrieve();
        return account.business_profile?.name ?? account.id;
    } catch {
        return "(name not readable with this key)";
    }
}

async function main() {
    console.log(
        `Account : ${await accountLabel()}\n` +
            `Mode    : ${isLive ? "LIVE" : "TEST"}\n` +
            `Action  : ${APPLY ? "apply changes" : "dry run (pass --apply to write)"}\n` +
            `Prices  : ${MIGRATE ? "migrate changed amounts" : "report changed amounts"}`,
    );

    if (isLive && APPLY) {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(
            "\nThis writes to the LIVE account and affects real billing. Type 'live' to continue: ",
        );
        rl.close();
        if (answer.trim() !== "live") {
            console.log("Aborted.");
            process.exit(1);
        }
    }

    let ok = true;
    for (const plan of PLANS) {
        ok = (await syncPlan(plan)) && ok;
    }

    console.log(
        APPLY
            ? "\nDone."
            : "\nDry run only - nothing was written. Re-run with --apply.",
    );
    process.exit(ok ? 0 : 1);
}

await main();
