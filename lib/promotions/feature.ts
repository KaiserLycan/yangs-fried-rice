/**
 * Promotions are switched off until they are properly implemented.
 * Flip this to `true` to bring the feature back; every guard reads it.
 */
export const PROMOTIONS_ENABLED = false;

export const PROMOTIONS_DISABLED_MESSAGE = "Promotions is not yet implemented.";

/** What a server action returns when something tries to use promotions. */
export const PROMOTIONS_FORBIDDEN = {
  data: null,
  error: PROMOTIONS_DISABLED_MESSAGE,
  code: "FORBIDDEN",
  status: 403,
} as const;
