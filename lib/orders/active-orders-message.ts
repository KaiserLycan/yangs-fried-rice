/**
 * The wording for "you can't delete your account yet" (issue #115). Apart
 * from `active-orders.ts` so the profile dialog — a client component — can
 * import it without pulling in the server Supabase client.
 */

/** The profile dialog's explanation, with the count. */
export function activeOrdersMessage(count: number): string {
  return count === 1
    ? "You have 1 order still in progress. You can delete your account once it's completed or cancelled."
    : `You have ${count} orders still in progress. You can delete your account once they're completed or cancelled.`;
}

/** What `deleteMyAccount` refuses with. */
export const DELETE_BLOCKED_MESSAGE =
  "You have an order in progress. You can delete your account once it's done.";
