import { describe, expect, it } from "vitest";
import { activeCustomerFilterCount, customerFiltersSchema } from "./customer-filters";

describe("customerFiltersSchema", () => {
  it("accepts no filters at all", () => {
    expect(customerFiltersSchema.safeParse({}).success).toBe(true);
  });

  it("accepts the 'top customers this month' query", () => {
    const res = customerFiltersSchema.safeParse({ from: "2026-09-01", to: "2026-09-28", minSpent: "2000" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.minSpent).toBe(2000);
  });

  it("refuses a period or joined range that ends before it starts", () => {
    expect(customerFiltersSchema.safeParse({ from: "2026-09-10", to: "2026-09-01" }).success).toBe(false);
    expect(customerFiltersSchema.safeParse({ joinedFrom: "2026-09-10", joinedTo: "2026-09-01" }).success).toBe(false);
  });

  it("refuses malformed dates, negative minimums and unknown activity", () => {
    expect(customerFiltersSchema.safeParse({ from: "09/01/2026" }).success).toBe(false);
    expect(customerFiltersSchema.safeParse({ from: "2026-09-01'; drop table customer;--" }).success).toBe(false);
    expect(customerFiltersSchema.safeParse({ minOrders: -1 }).success).toBe(false);
    expect(customerFiltersSchema.safeParse({ minSpent: -5 }).success).toBe(false);
    expect(customerFiltersSchema.safeParse({ activity: "sometimes" }).success).toBe(false);
  });
});

describe("activeCustomerFilterCount", () => {
  it("counts a period or range once, ignores 'any' activity", () => {
    expect(activeCustomerFilterCount({})).toBe(0);
    expect(activeCustomerFilterCount({ from: "2026-09-01", to: "2026-09-28" })).toBe(1);
    expect(activeCustomerFilterCount({ activity: "any" })).toBe(0);
    expect(
      activeCustomerFilterCount({
        from: "2026-09-01",
        minOrders: 0,
        minSpent: 2000,
        joinedTo: "2026-08-31",
        activity: "not_ordered",
      }),
    ).toBe(5);
  });
});
