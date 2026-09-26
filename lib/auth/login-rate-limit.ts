import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Failed sign-in limiting, shared by every password sign-in path: the
 * customer and employee server actions and the two `/api/auth/*-login`
 * routes. Before this there was no limit at all, so a password could be
 * guessed at whatever rate the network allowed.
 *
 * Two counters, both over a sliding window:
 *
 * - per email: 5 wrong passwords in 15 minutes locks that email for the rest
 *   of the window. This is what stops guessing one account's password.
 * - per IP: 30 wrong passwords in 15 minutes, across any emails. This stops
 *   one machine walking a list of accounts, while leaving room for a shared
 *   office or campus connection.
 *
 * The lock is counted against the email that was *typed*, whether or not an
 * account exists for it, so the lock message reveals nothing about which
 * addresses are registered. Recovery is waiting out the window or resetting
 * the password: `resetPassword` clears the counter, and the message says so.
 *
 * Attempts live in `public.login_attempt`
 * (supabase/migrations/20260926000001_login_attempt.sql), readable only by
 * the service role. Emails are stored as a SHA-256 hash; the table exists to
 * count, not to keep a list of who tried to sign in.
 *
 * Fails open. If the table is missing (migration not yet applied) or the
 * service role key is not configured, sign-in works exactly as before and the
 * error is logged. A limiter that could lock everyone out would be worse than
 * the gap it closes.
 */

export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 30;
export const WINDOW_MINUTES = 15;

const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

export type LoginGate = { allowed: true } | { allowed: false; retryAfterMinutes: number };

export function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * Pure decision: given the failure times inside the window (any order), is
 * another attempt allowed, and if not, for how long? The lock lifts when the
 * oldest failure that still counts toward the limit slides out of the window.
 */
export function gateFromFailures(
  failureTimes: Date[],
  limit: number,
  now: Date = new Date(),
): LoginGate {
  const recent = failureTimes
    .map((time) => time.getTime())
    .filter((time) => now.getTime() - time < WINDOW_MS)
    .sort((a, b) => b - a); // newest first
  if (recent.length < limit) return { allowed: true };

  // The limit-th newest failure is the one whose expiry drops the count
  // back below the limit.
  const unlocksAt = recent[limit - 1] + WINDOW_MS;
  return {
    allowed: false,
    retryAfterMinutes: Math.max(1, Math.ceil((unlocksAt - now.getTime()) / 60_000)),
  };
}

export function lockedOutMessage(gate: Extract<LoginGate, { allowed: false }>): string {
  const minutes = gate.retryAfterMinutes;
  return `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your password.`;
}

/** The caller's IP as the proxy reports it, or null when there is none. */
export function clientIpFrom(headerValue: string | null | undefined): string | null {
  const first = headerValue?.split(",")[0]?.trim();
  return first ? first : null;
}

/** May this email / IP try a password now? */
export async function checkLoginAllowed(email: string, ip: string | null): Promise<LoginGate> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const [byEmail, byIp] = await Promise.all([
      admin
        .from("login_attempt")
        .select("attempted_at")
        .eq("email_hash", emailKey(email))
        .gte("attempted_at", since),
      ip
        ? admin.from("login_attempt").select("attempted_at").eq("ip", ip).gte("attempted_at", since)
        : Promise.resolve({ data: [] as { attempted_at: string }[], error: null }),
    ]);
    if (byEmail.error) throw byEmail.error;
    if (byIp.error) throw byIp.error;

    const toDates = (rows: { attempted_at: string }[] | null) =>
      (rows ?? []).map((row) => new Date(row.attempted_at));

    const emailGate = gateFromFailures(toDates(byEmail.data), MAX_FAILURES_PER_EMAIL);
    if (!emailGate.allowed) return emailGate;
    return gateFromFailures(toDates(byIp.data), MAX_FAILURES_PER_IP);
  } catch (err) {
    console.error("checkLoginAllowed: rate limiting unavailable, allowing sign-in:", err);
    return { allowed: true };
  }
}

/** Count a wrong password. Also prunes rows too old to matter. */
export async function recordLoginFailure(email: string, ip: string | null): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("login_attempt")
      .insert({ email_hash: emailKey(email), ip });
    if (error) throw error;

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin.from("login_attempt").delete().lt("attempted_at", dayAgo);
  } catch (err) {
    console.error("recordLoginFailure:", err);
  }
}

/**
 * Forget an email's failures — after a successful sign-in or a password
 * reset. The IP counter is left alone: one success on a shared connection
 * should not reset the budget for every other account tried from it.
 */
export async function clearLoginFailures(email: string): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("login_attempt")
      .delete()
      .eq("email_hash", emailKey(email));
    if (error) throw error;
  } catch (err) {
    console.error("clearLoginFailures:", err);
  }
}
