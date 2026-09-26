/**
 * What every guard says when the account behind a valid session has been
 * disabled (issue #114).
 *
 * A disabled user can still hold a perfectly good Supabase token — disabling
 * is a flag on `customer` / `employee`, not a revoked session — so each
 * server-side guard re-reads the flag and refuses with this code. The UI keys
 * off the code, not the wording: on `ACCOUNT_DISABLED` it signs the user out
 * and sends them to the matching login page, which shows the message again
 * (`?error=account-disabled`).
 */

export const ACCOUNT_DISABLED_CODE = "ACCOUNT_DISABLED";

/** The query value the login pages read to explain why you were signed out. */
export const ACCOUNT_DISABLED_LOGIN_ERROR = "account-disabled";

export const ACCOUNT_DISABLED_MESSAGE =
  "Your account has been disabled. Please contact the store if you think this is a mistake.";

export const EMPLOYEE_ACCOUNT_DISABLED_MESSAGE =
  "Your account has been disabled. Please contact your manager.";
