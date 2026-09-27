/**
 * Where to send someone after they sign in or sign up, from `?next=`.
 *
 * Only a path on this site is accepted. `router.push` follows an absolute
 * URL too, so `?next=https://evil.example` — or the protocol-relative
 * `//evil.example`, or `/\evil.example`, which browsers read the same way —
 * would turn the login page into an open redirect: a link that really is
 * our site, dropping the customer somewhere that is not, right after they
 * typed their password.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  // Control characters (a smuggled newline or tab) have no place in a path.
  if (/[\u0000-\u001f\u007f]/.test(path)) return fallback;
  return path;
}
