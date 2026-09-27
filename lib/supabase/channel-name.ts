let counter = 0;

/**
 * A realtime channel name no other subscription in this tab is using.
 *
 * `supabase.channel(name)` hands back the *existing* channel when the name is
 * taken, and `removeChannel` only drops it after an async unsubscribe. So two
 * components on one page with the same name (the nav bell is mounted in both
 * the desktop bar and the mobile header), or a React Strict Mode re-run of an
 * effect, got a channel that was already subscribed — and `.on()` after
 * `subscribe()` throws. What a subscriber receives is decided by its
 * `postgres_changes` filter and RLS, not by the name, so a unique suffix
 * changes nothing else.
 */
export function uniqueChannelName(base: string): string {
  counter += 1;
  return `${base}:${counter}`;
}
