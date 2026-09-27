import { z } from "zod";
import { AUDIT_CATEGORY_IDS } from "@/lib/audit/audit-actions";

/**
 * The columns the table can sort by. A fixed list, so a sort parameter can
 * only ever name one of these — never an arbitrary column.
 */
export const AUDIT_SORT_COLUMNS = ["occurred_at", "actor_name", "action", "summary"] as const;
export type AuditSortColumn = (typeof AUDIT_SORT_COLUMNS)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Dates must be YYYY-MM-DD." });

/**
 * Filters for the audit log (`getAuditLog`, `GET /api/audit-log`). Dates are
 * calendar days in Manila time, the same convention as the reports, and both
 * ends are inclusive.
 */
export const auditLogFilterSchema = z
  .object({
    category: z.enum(AUDIT_CATEGORY_IDS).optional(),
    actor_id: z.string().uuid({ message: "actor_id must be a valid UUID" }).optional(),
    date_from: isoDate.optional(),
    date_to: isoDate.optional(),
    /** Matches the summary, case-insensitively. Filter by person with `actor_id`. */
    search: z.string().trim().max(80).optional(),
    /** Newest first unless asked otherwise. */
    sort: z.enum(AUDIT_SORT_COLUMNS).default("occurred_at"),
    direction: z.enum(["asc", "desc"]).default("desc"),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (value) => !value.date_from || !value.date_to || value.date_from <= value.date_to,
    { message: "The start date must be on or before the end date.", path: ["date_to"] },
  );

export type AuditLogFilters = z.infer<typeof auditLogFilterSchema>;

/**
 * The search box reaches the database only as the value of `.ilike()`, which
 * the client encodes — it can never change the filter itself (see
 * __tests__/security/injection.test.ts, B4). What is left is LIKE's own
 * wildcards: `%` and `_` are escaped so "50%" finds those characters rather
 * than everything, and `*`, which PostgREST also treats as a wildcard, is
 * dropped.
 */
export function sanitiseAuditSearch(value: string | undefined): string {
  return (value ?? "")
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Manila is UTC+8 all year (no daylight saving). */
export function manilaDayStart(date: string): string {
  return `${date}T00:00:00+08:00`;
}

/** The start of the day after `date`, so `date_to` includes the whole day. */
export function manilaDayAfter(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const iso = next.toISOString().slice(0, 10);
  return `${iso}T00:00:00+08:00`;
}
