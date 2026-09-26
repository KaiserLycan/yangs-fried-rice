import { createAdminClient } from "@/lib/supabase/admin";
import {
  storagePathFromPublicUrl,
  type ImageBucket,
} from "@/lib/storage/stored-image";

/**
 * Delete the stored file behind one or more public image URLs.
 *
 * SERVER ONLY, and deliberately not a Server Action: this file has no
 * "use server" directive, so nothing here can be called from the browser.
 * Callers are server actions that have already decided the caller is allowed
 * to discard the image. It uses the service role because bucket policies
 * were set up in the dashboard and do not reliably grant DELETE — and until
 * now nothing in the app ever removed a file, so no policy was ever tested.
 *
 * Best-effort by design: a failed cleanup leaves an orphaned file, which is
 * the status quo, whereas failing the caller would undo a save the user
 * already made. Errors are logged, never thrown.
 */
export async function removeStoredImages(
  bucket: ImageBucket,
  urls: (string | null | undefined)[],
): Promise<void> {
  const paths = urls
    .map((url) => storagePathFromPublicUrl(url, bucket))
    .filter((path): path is string => path !== null);
  if (paths.length === 0) return;

  try {
    const { error } = await createAdminClient().storage.from(bucket).remove(paths);
    if (error) console.error(`removeStoredImages(${bucket}):`, error.message);
  } catch (err) {
    console.error(`removeStoredImages(${bucket}):`, err);
  }
}

export function removeStoredImage(
  bucket: ImageBucket,
  url: string | null | undefined,
): Promise<void> {
  return removeStoredImages(bucket, [url]);
}
