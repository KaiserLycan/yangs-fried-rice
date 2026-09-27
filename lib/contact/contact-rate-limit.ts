/**
 * A small per-IP limit on the landing page's contact form, so one visitor
 * cannot flood the store's inbox (or burn the Resend daily quota).
 *
 * In memory, per server instance. On a serverless host each instance keeps
 * its own count and a cold start forgets it, so this is a speed bump, not a
 * wall — the honeypot and Resend's own limits sit behind it. Sign-in, where a
 * leak matters, uses the database-backed limiter in
 * `lib/auth/login-rate-limit.ts` instead.
 */

export const MAX_MESSAGES_PER_IP = 3;
export const CONTACT_WINDOW_MINUTES = 10;

const WINDOW_MS = CONTACT_WINDOW_MINUTES * 60 * 1000;

const sentAt = new Map<string, number[]>();

export type ContactGate = { allowed: true } | { allowed: false; retryAfterMinutes: number };

/** Pure decision over the send times already recorded for one IP. */
export function contactGate(times: number[], now: number = Date.now()): ContactGate {
  const recent = times.filter((time) => now - time < WINDOW_MS).sort((a, b) => a - b);
  if (recent.length < MAX_MESSAGES_PER_IP) return { allowed: true };
  const unlocksAt = recent[recent.length - MAX_MESSAGES_PER_IP] + WINDOW_MS;
  return { allowed: false, retryAfterMinutes: Math.max(1, Math.ceil((unlocksAt - now) / 60_000)) };
}

/** May this IP send another message now? A missing IP shares one bucket. */
export function checkContactAllowed(ip: string | null, now: number = Date.now()): ContactGate {
  return contactGate(sentAt.get(ip ?? "unknown") ?? [], now);
}

/** Count a sent message, dropping ones that have left the window. */
export function recordContactSent(ip: string | null, now: number = Date.now()): void {
  const key = ip ?? "unknown";
  const recent = (sentAt.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  sentAt.set(key, recent);
}

export function contactLimitMessage(gate: Extract<ContactGate, { allowed: false }>): string {
  const minutes = gate.retryAfterMinutes;
  return `You've sent several messages already. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or call us.`;
}

/** For tests. */
export function resetContactLimit(): void {
  sentAt.clear();
}
