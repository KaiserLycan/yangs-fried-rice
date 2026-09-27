import { describe, expect, it } from "vitest";
import {
  auditLogFilterSchema,
  manilaDayAfter,
  manilaDayStart,
  sanitiseAuditSearch,
} from "./audit";

describe("auditLogFilterSchema", () => {
  it("defaults to the first 25 entries", () => {
    const parsed = auditLogFilterSchema.parse({});
    expect(parsed.limit).toBe(25);
    expect(parsed.offset).toBe(0);
  });

  it("accepts every filter together", () => {
    expect(
      auditLogFilterSchema.safeParse({
        category: "orders",
        actor_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        date_from: "2026-09-01",
        date_to: "2026-09-27",
        search: "price",
        limit: "50",
        offset: "100",
      }).success,
    ).toBe(true);
  });

  it("refuses an unknown category, a bad id, a bad date and an oversized page", () => {
    expect(auditLogFilterSchema.safeParse({ category: "everything" }).success).toBe(false);
    expect(auditLogFilterSchema.safeParse({ actor_id: "not-a-uuid" }).success).toBe(false);
    expect(auditLogFilterSchema.safeParse({ date_from: "27/09/2026" }).success).toBe(false);
    expect(auditLogFilterSchema.safeParse({ limit: 500 }).success).toBe(false);
  });

  it("refuses a range that ends before it starts", () => {
    expect(
      auditLogFilterSchema.safeParse({ date_from: "2026-09-10", date_to: "2026-09-01" }).success,
    ).toBe(false);
  });
});

describe("sanitiseAuditSearch", () => {
  // The value only ever reaches .ilike(); what's left to neutralise is LIKE's
  // own wildcards, so a search means exactly the characters typed.
  it("escapes LIKE wildcards and drops PostgREST's *", () => {
    expect(sanitiseAuditSearch("50%")).toBe("50\\%");
    expect(sanitiseAuditSearch("order_status")).toBe("order\\_status");
    expect(sanitiseAuditSearch("  *price*  ")).toBe("price");
    expect(sanitiseAuditSearch(undefined)).toBe("");
  });
});

describe("Manila day boundaries", () => {
  it("starts a day at Manila midnight", () => {
    expect(manilaDayStart("2026-09-27")).toBe("2026-09-27T00:00:00+08:00");
  });

  it("ends a day at the next Manila midnight, across month and year ends", () => {
    expect(manilaDayAfter("2026-09-27")).toBe("2026-09-28T00:00:00+08:00");
    expect(manilaDayAfter("2026-09-30")).toBe("2026-10-01T00:00:00+08:00");
    expect(manilaDayAfter("2026-12-31")).toBe("2027-01-01T00:00:00+08:00");
  });
});
