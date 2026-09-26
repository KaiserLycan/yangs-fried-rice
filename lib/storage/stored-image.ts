/**
 * Pure helpers for images kept in Supabase Storage. No client, no I/O, so
 * both the browser upload code and the server actions can import them.
 *
 * The database stores each image as a *public URL*, not a storage path —
 * `product.image_url`, `customer.profileImage_URL`, `employee.profileImage_URL`
 * and `delivery.proof_of_delivery` all hold the result of `getPublicUrl()`.
 * Removing the file therefore starts by turning that URL back into a path.
 */

/** Every bucket the app writes images into. */
export const IMAGE_BUCKETS = {
  menu: "menu-images",
  customerAvatar: "avatars",
  employeeAvatar: "emp-pfp",
  proofOfDelivery: "proof-of-delivery",
} as const;

export type ImageBucket = (typeof IMAGE_BUCKETS)[keyof typeof IMAGE_BUCKETS];

/**
 * The storage path inside `bucket` that a public URL points at, or null when
 * the URL is not a public object in that bucket.
 *
 * Null is the safe answer for anything unrecognised — seed data points at
 * external hosts, and a URL from a *different* bucket must never be read as
 * a path in this one, or a cleanup could delete an unrelated file that
 * happens to share its name.
 */
export function storagePathFromPublicUrl(
  url: string | null | undefined,
  bucket: ImageBucket,
): string | null {
  if (!url) return null;

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  const at = pathname.indexOf(marker);
  if (at === -1) return null;

  const path = decodeURIComponent(pathname.slice(at + marker.length));
  // An empty path or one that climbs out of the bucket is not a file we own.
  if (!path || path.split("/").some((part) => part === "..")) return null;
  return path;
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

/**
 * The file extension that matches what is actually inside `file`.
 *
 * Taken from the MIME type, not the original filename: `compressImage`
 * re-encodes everything to WebP, so a phone photo named `IMG_0042.jpg` was
 * being stored as `.jpg` with WebP bytes inside. Falls back to the filename
 * only for a type this map does not know.
 */
export function imageExtensionFor(file: { type: string; name?: string }): string {
  const known = EXTENSION_BY_TYPE[file.type];
  if (known) return known;
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  return fromName && fromName !== file.name?.toLowerCase() ? fromName : "bin";
}

/** Same limits the proof-of-delivery upload already enforces. */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Why a profile-photo upload should be refused, or null if it is fine.
 * Checked on the server: `accept="image/*"` on the input is only a hint to
 * the file picker and constrains nothing.
 */
export function imageUploadProblem(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Photos must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Photos must be under 5MB.";
  }
  return null;
}
