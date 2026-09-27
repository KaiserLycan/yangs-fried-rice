import { z } from "zod";

/**
 * "Report a problem" on a completed order (limitations #24, issue #118).
 *
 * The database holds the same rules (`order_issue` in
 * 20260928000000_notifications_order_issues_and_realtime.sql): the three
 * types, a 500-character note, 1–50 lines, and a report only on the
 * customer's own completed order within 24 hours. This module is the
 * friendlier first line, not the only one.
 */

export const ORDER_ISSUE_TYPES = ["missing", "wrong", "damaged"] as const;
export type OrderIssueType = (typeof ORDER_ISSUE_TYPES)[number];

export const ORDER_ISSUE_LABELS: Record<OrderIssueType, string> = {
  missing: "Missing",
  wrong: "Wrong item",
  damaged: "Damaged",
};

/** How long after pickup a problem can be reported. */
export const ORDER_ISSUE_WINDOW_HOURS = 24;

export const ORDER_ISSUE_NOTE_MAX = 500;

export const ORDER_ISSUE_PHOTO_BUCKET = "order-issue-photos";
/** Bucket limit, mirrored so the form can refuse a large file before sending. */
export const ORDER_ISSUE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const ORDER_ISSUE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** How long a staff member's link to a photo works. */
export const ORDER_ISSUE_PHOTO_URL_TTL_SECONDS = 5 * 60;

export const reportOrderIssueSchema = z.object({
  order_id: z.string().uuid({ message: "Order not found." }),
  order_item_ids: z
    .array(z.string().uuid())
    .min(1, { message: "Tick at least one item." })
    .max(50, { message: "Too many items selected." })
    .transform((ids) => Array.from(new Set(ids))),
  issue_type: z.enum(ORDER_ISSUE_TYPES, {
    errorMap: () => ({ message: "Choose Missing, Wrong item or Damaged." }),
  }),
  note: z
    .string()
    .trim()
    .max(ORDER_ISSUE_NOTE_MAX, { message: `Keep the note under ${ORDER_ISSUE_NOTE_MAX} characters.` })
    .optional()
    .transform((note) => (note ? note : null)),
});

export type ReportOrderIssueInput = z.input<typeof reportOrderIssueSchema>;

/**
 * Can this order still be reported? Completed, and picked up (or, for an
 * old row with no `completed_at`, placed) within the window. `now` is a
 * parameter so the rule is testable and so the server and the button agree.
 */
export function canReportIssue(
  order: { orderStatus: string | null; completedAt: string | null; placedAt: string | null },
  now: Date = new Date(),
): boolean {
  if ((order.orderStatus ?? "").trim().toLowerCase() !== "completed") return false;
  const since = order.completedAt ?? order.placedAt;
  if (!since) return false;
  const at = new Date(since).getTime();
  if (Number.isNaN(at)) return false;
  return now.getTime() - at < ORDER_ISSUE_WINDOW_HOURS * 60 * 60 * 1000;
}

/** Why this photo can't be attached, or null when it can. */
export function orderIssuePhotoProblem(file: { size: number; type: string }): string | null {
  if (!(ORDER_ISSUE_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Attach a photo (JPEG, PNG or WebP).";
  }
  if (file.size > ORDER_ISSUE_PHOTO_MAX_BYTES) {
    return "The photo must be 2 MB or smaller.";
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when `path` is a plain `<uuid>/<file>` path — the only shape the
 * bucket's folder policy and the table's CHECK accept.
 */
export function isOrderIssuePhotoPath(path: string): boolean {
  const parts = path.split("/");
  return (
    parts.length === 2 &&
    UUID.test(parts[0]) &&
    /^[A-Za-z0-9._-]+$/.test(parts[1]) &&
    parts[1] !== "." &&
    parts[1] !== ".."
  );
}
