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
