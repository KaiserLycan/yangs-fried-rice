import { describe, expect, it } from "vitest";
import { functionSql } from "@/__tests__/helpers/schema";
import {
  canReportIssue,
  isOrderIssuePhotoPath,
  orderIssuePhotoProblem,
  reportOrderIssueSchema,
} from "./order-issue";

const NOW = new Date("2026-09-28T12:00:00.000Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();

describe("canReportIssue", () => {
  it("allows a completed order within 24 hours of pickup", () => {
    expect(
      canReportIssue({ orderStatus: "completed", completedAt: hoursAgo(23), placedAt: hoursAgo(24) }, NOW),
    ).toBe(true);
  });

  it("closes at 24 hours", () => {
    expect(
      canReportIssue({ orderStatus: "completed", completedAt: hoursAgo(24), placedAt: hoursAgo(25) }, NOW),
    ).toBe(false);
  });

  it("falls back to when it was placed for an old row with no completion time", () => {
    expect(canReportIssue({ orderStatus: "completed", completedAt: null, placedAt: hoursAgo(2) }, NOW)).toBe(true);
    expect(canReportIssue({ orderStatus: "completed", completedAt: null, placedAt: null }, NOW)).toBe(false);
  });

  it.each(["pending", "preparing", "ready", "cancelled", null])("refuses a %s order", (status) => {
    expect(canReportIssue({ orderStatus: status, completedAt: hoursAgo(1), placedAt: hoursAgo(2) }, NOW)).toBe(false);
  });
});

describe("reportOrderIssueSchema", () => {
  const valid = {
    order_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    order_item_ids: ["0a1b2c3d-1111-4222-8333-444455556666"],
    issue_type: "missing",
  };

  it("accepts a report and turns a blank note into null", () => {
    const parsed = reportOrderIssueSchema.parse({ ...valid, note: "   " });
    expect(parsed.note).toBeNull();
  });

  it("needs at least one item and a known type", () => {
    expect(reportOrderIssueSchema.safeParse({ ...valid, order_item_ids: [] }).success).toBe(false);
    expect(reportOrderIssueSchema.safeParse({ ...valid, issue_type: "late" }).success).toBe(false);
  });

  it("drops a line ticked twice", () => {
    const id = valid.order_item_ids[0];
    expect(reportOrderIssueSchema.parse({ ...valid, order_item_ids: [id, id] }).order_item_ids).toEqual([id]);
  });

  it("caps the note at 500 characters", () => {
    expect(reportOrderIssueSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("photo rules", () => {
  it("accepts images up to 2 MB", () => {
    expect(orderIssuePhotoProblem({ type: "image/webp", size: 2 * 1024 * 1024 })).toBeNull();
    expect(orderIssuePhotoProblem({ type: "image/webp", size: 2 * 1024 * 1024 + 1 })).toMatch(/2 MB/);
    expect(orderIssuePhotoProblem({ type: "application/pdf", size: 10 })).toMatch(/photo/);
  });

  it("only takes a <uuid>/<file> path", () => {
    expect(isOrderIssuePhotoPath("7c9e6679-7425-40de-944b-e07fc1f90ae7/abc.webp")).toBe(true);
    expect(isOrderIssuePhotoPath("../7c9e6679-7425-40de-944b-e07fc1f90ae7/abc.webp")).toBe(false);
    expect(isOrderIssuePhotoPath("7c9e6679-7425-40de-944b-e07fc1f90ae7/..")).toBe(false);
    expect(isOrderIssuePhotoPath("someone/abc.webp")).toBe(false);
  });
});

describe("guard_order_issue_update", () => {
  const sql = functionSql("guard_order_issue_update");

  // `text[] || 'photo_path'` is read as array || array-literal and raises
  // "malformed array literal" — which broke resolving any report without a
  // photo on live until the elements were cast.
  it("appends column names as text, not as array literals", () => {
    expect(sql).toMatch(/v_ignored := v_ignored \|\| 'customer_id'::text;/);
    expect(sql).toMatch(/v_ignored := v_ignored \|\| 'photo_path'::text;/);
  });

  it("lets erasure through only by clearing, never by setting", () => {
    expect(sql).toMatch(/IF NEW\.customer_id IS NULL THEN/);
    expect(sql).toMatch(/IF NEW\.photo_path IS NULL THEN/);
  });
});
