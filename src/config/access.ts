// src/config/access.ts

/**
 * TEMPORARY: whether internal tooling (the Dev Console at /dev) is restricted
 * to Menumo staff.
 *
 * Currently `false`, which means any signed-in business user can reach /dev.
 *
 * Why it is off: the gate keys off `AppUserProfile.isInternal`, and that flag is
 * deliberately not settable from inside the app - it has to be written by hand
 * in the Firebase console. Nobody on the team currently has access to the
 * `menumo-ai` Firebase project, so with the gate on, /dev is unreachable for
 * everyone including the test accounts that need it.
 *
 * Turning this back to `true` is the entire re-enable. The profile field, the
 * `RequireInternal` guard, the `isInternal` flag on AuthContext and the nav
 * filtering are all still in place and still wired up; this only short-circuits
 * the check. Flip it as soon as Firebase project access lands and `isInternal`
 * can actually be granted.
 *
 * What is NOT reverted, and must not be: the Dev Console seeds target
 * DEMO_ACCOUNT_ID rather than the signed-in user's real account. That fix stops
 * "Seed account + owner" overwriting a live business name and resetting its
 * subscription, which is a data-loss bug independent of who can open the page.
 */
export const ENFORCE_INTERNAL_ONLY = false;

/**
 * TEMPORARY: whether plan entitlements are enforced.
 *
 * Currently `false`, so every gated capability is available to every account.
 *
 * Why it is off: every beta account is `mvp`/`trial`, which resolves to Pro,
 * while Advanced P&L is a Business-tier capability. Switching the gate on took
 * quarter and year comparisons, the six-month trend and CSV export away from
 * people who were already using them. Launching a paid tier is one thing;
 * removing working features from beta users mid-beta is another, and the second
 * is not something to do by side effect of shipping the entitlement layer.
 *
 * Turning this back to `true` is the entire re-enable. `resolvePlan`,
 * `GATED_CAPABILITIES`, the locked-state UI and the upgrade prompts all stay
 * wired and exercised; this only short-circuits the final check. Flip it when
 * billing is real and there is something to actually upgrade to.
 *
 * Tracked in issue #35.
 */
export const ENFORCE_PLAN_GATES = false;
