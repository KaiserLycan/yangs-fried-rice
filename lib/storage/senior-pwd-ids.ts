import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Senior Citizen / PWD ID photos (issue #114; the discount flow itself is
 * issue #116).
 *
 * These are government IDs, so unlike every other image in the app they are
 * never given a public URL. The `senior-pwd-ids` bucket is private
 * (20260927000002_security_hardening_indexes_and_storage.sql):
 *
 *   - a customer uploads only into their own folder, `<customer uuid>/…`, and
 *     can read only that folder;
 *   - staff and managers can read any file, and delete it once the order is
 *     done;
 *   - nobody else can read anything, and there is no public read at all.
 *
 * To show a photo, the server signs a URL that stops working after
 * `SENIOR_PWD_ID_URL_TTL_SECONDS`. Store the *path* on the order, never a
 * URL: a signed URL saved to the database would be dead in five minutes, and
 * a public one must not exist.
 */

export const SENIOR_PWD_ID_BUCKET = "senior-pwd-ids";

/** How long a signed link to an ID photo works — long enough to look, no longer. */
export const SENIOR_PWD_ID_URL_TTL_SECONDS = 5 * 60;

/** Bucket limit, mirrored so the form can refuse a large file before uploading. */
export const SENIOR_PWD_ID_MAX_BYTES = 2 * 1024 * 1024;

export const SENIOR_PWD_ID_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

const EXTENSION_BY_TYPE: Record<(typeof SENIOR_PWD_ID_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Why this file can't be used as an ID photo, or null when it can. Checked in
 * the browser for a quick answer; the bucket enforces the same limits.
 */
export function seniorPwdIdUploadProblem(file: { size: number; type: string }): string | null {
  if (!(SENIOR_PWD_ID_TYPES as readonly string[]).includes(file.type)) {
    return "Upload a photo of the ID (JPEG, PNG, WebP or HEIC).";
  }
  if (file.size > SENIOR_PWD_ID_MAX_BYTES) {
    return "The photo must be 2 MB or smaller.";
  }
  return null;
}

/**
 * Where a customer's ID photo goes: their own folder, a random file name.
 * The folder is what the storage policy checks against `auth.uid()`, so it
 * must be the signed-in customer's id and nothing else.
 */
export function seniorPwdIdPath(
  customerId: string,
  contentType: (typeof SENIOR_PWD_ID_TYPES)[number],
  fileId: string = crypto.randomUUID(),
): string {
  if (!UUID.test(customerId)) {
    throw new Error("seniorPwdIdPath: customerId must be a UUID.");
  }
  return `${customerId}/${fileId}.${EXTENSION_BY_TYPE[contentType]}`;
}

/**
 * True when `path` is a plain `<uuid>/<file>` path in this bucket — no
 * climbing out with `..`, no extra folders. Anything else is refused before
 * it reaches Storage.
 */
export function isSeniorPwdIdPath(path: string): boolean {
  const parts = path.split("/");
  return (
    parts.length === 2 &&
    UUID.test(parts[0]) &&
    parts[1].length > 0 &&
    parts[1] !== ".." &&
    parts[1] !== "."
  );
}

/**
 * A short-lived link to one ID photo, or null when the caller may not see it.
 *
 * Pass the caller's own (session) Supabase client, not the service role: the
 * bucket's policies then decide — the customer who uploaded it, or staff —
 * and a request for somebody else's ID simply fails.
 */
export async function signSeniorPwdIdUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds: number = SENIOR_PWD_ID_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!isSeniorPwdIdPath(path)) return null;

  const ttl = Math.min(Math.max(1, Math.floor(expiresInSeconds)), SENIOR_PWD_ID_URL_TTL_SECONDS);
  const { data, error } = await supabase.storage
    .from(SENIOR_PWD_ID_BUCKET)
    .createSignedUrl(path, ttl);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
