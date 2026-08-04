// Creates or updates the Menumo subscription products and their monthly prices
// in Stripe, from `src/config/plans.ts`.
//
//   node scripts/stripe-seed-products.mjs            # dry run, shows the plan
//   node scripts/stripe-seed-products.mjs --apply    # actually write to Stripe
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

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import Stripe from "stripe";
import { PLANS } from "../src/config/plans.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

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
const lookupKey = (planId) => `menumo_${planId}_monthly`;

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

async function syncPlan(plan) {
    const id = productId(plan.id);
    const desired = desiredProduct(plan);
    const cents = Math.round(plan.priceMonthly * 100);

    console.log(`\n${plan.name}  ($${plan.priceMonthly}/mo)`);

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

    const key = lookupKey(plan.id);
    const found = await stripe.prices.list({
        lookup_keys: [key],
        active: true,
        limit: 1,
    });
    const price = found.data[0];

    if (!price) {
        console.log(`  price ${key}: CREATE at $${plan.priceMonthly}/mo`);
        if (APPLY) {
            await stripe.prices.create({
                product: id,
                currency: "usd",
                unit_amount: cents,
                recurring: { interval: "month" },
                lookup_key: key,
                metadata: { plan_id: plan.id },
            });
        }
    } else if (price.unit_amount !== cents) {
        // Stripe prices are immutable. Re-pointing the lookup key here would
        // change what new customers pay while existing subscribers silently
        // stayed on the old amount, so this stops and says so instead.
        console.error(
            `  price ${key}: MISMATCH - Stripe has ${price.unit_amount}, ` +
                `plans.ts says ${cents}.`,
        );
        console.error(
            `    Prices cannot be edited. Create a replacement and migrate ` +
                `subscribers deliberately: https://docs.stripe.com/billing/subscriptions/upgrade-downgrade`,
        );
        return false;
    } else {
        console.log(`  price ${key}: up to date ($${plan.priceMonthly}/mo)`);
    }

    return true;
}

async function main() {
    const account = await stripe.accounts.retrieve();
    console.log(
        `Account : ${account.business_profile?.name ?? account.id}\n` +
            `Mode    : ${isLive ? "LIVE" : "TEST"}\n` +
            `Action  : ${APPLY ? "apply changes" : "dry run (pass --apply to write)"}`,
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
