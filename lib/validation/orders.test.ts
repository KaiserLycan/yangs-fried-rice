import { describe, it, expect } from "vitest";
import {
  orderStatusSchema,
  isValidTransition,
  VALID_TRANSITIONS,
  ORDER_STATUSES,
  orderFilterSchema,
  reportDateRangeSchema,
  salesReportQuerySchema,
  performanceReportQuerySchema,
  REPORT_FREQUENCIES,
} from "./orders";

describe("orderStatusSchema", () => {
  it.each(ORDER_STATUSES)("accepts '%s'", (status) => {
    expect(orderStatusSchema.safeParse(status).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(orderStatusSchema.safeParse("bogus").success).toBe(false);
    expect(orderStatusSchema.safeParse("").success).toBe(false);
  });
});

describe("isValidTransition", () => {
  // Forward pipeline
  it("received → preparing", () => {
    expect(isValidTransition("received", "preparing")).toBe(true);
  });

  it("preparing → out_for_delivery", () => {
    expect(isValidTransition("preparing", "out_for_delivery")).toBe(true);
  });

  it("out_for_delivery → completed", () => {
    expect(isValidTransition("out_for_delivery", "completed")).toBe(true);
  });

  // Cancel from any non-terminal
  it("received → cancelled", () => {
    expect(isValidTransition("received", "cancelled")).toBe(true);
  });

  it("preparing → cancelled", () => {
    expect(isValidTransition("preparing", "cancelled")).toBe(true);
  });

  it("out_for_delivery → cancelled", () => {
    expect(isValidTransition("out_for_delivery", "cancelled")).toBe(true);
  });

  // Invalid: skip a stage
  it("received → out_for_delivery (skip)", () => {
    expect(isValidTransition("received", "out_for_delivery")).toBe(false);
  });

  it("received → completed (skip)", () => {
    expect(isValidTransition("received", "completed")).toBe(false);
  });

  // Invalid: backwards
  it("preparing → received (backwards)", () => {
    expect(isValidTransition("preparing", "received")).toBe(false);
  });

  it("completed → preparing (backwards from terminal)", () => {
    expect(isValidTransition("completed", "preparing")).toBe(false);
  });

  // Terminal states have no transitions
  it("completed has no valid transitions", () => {
    expect(VALID_TRANSITIONS.completed).toHaveLength(0);
  });

  it("cancelled has no valid transitions", () => {
    expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("cancelled → received (reopen)", () => {
    expect(isValidTransition("cancelled", "received")).toBe(false);
  });

  it("completed → cancelled", () => {
    expect(isValidTransition("completed", "cancelled")).toBe(false);
  });
});

describe("orderFilterSchema", () => {
  it("accepts empty object with defaults", () => {
    const result = orderFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it("accepts valid status filter", () => {
    const result = orderFilterSchema.safeParse({ status: "preparing" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      orderFilterSchema.safeParse({ status: "bogus" }).success,
    ).toBe(false);
  });

  it("coerces string limit to number", () => {
    const result = orderFilterSchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(10);
  });

  it("rejects limit > 100", () => {
    expect(
      orderFilterSchema.safeParse({ limit: 200 }).success,
    ).toBe(false);
  });
});

describe("reportDateRangeSchema", () => {
  it("accepts valid date range", () => {
    const result = reportDateRangeSchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-10",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty start_date", () => {
    expect(
      reportDateRangeSchema.safeParse({ start_date: "", end_date: "2026-09-10" })
        .success,
    ).toBe(false);
  });

  it("rejects empty end_date", () => {
    expect(
      reportDateRangeSchema.safeParse({ start_date: "2026-09-01", end_date: "" })
        .success,
    ).toBe(false);
  });

  it("defaults start_date and end_date to today when omitted", () => {
    const result = reportDateRangeSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      const today = new Date().toISOString().split("T")[0];
      expect(result.data.start_date).toBe(today);
      expect(result.data.end_date).toBe(today);
    }
  });

  it("accepts same start_date and end_date", () => {
    const result = reportDateRangeSchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects end_date before start_date", () => {
    const result = reportDateRangeSchema.safeParse({
      start_date: "2026-09-10",
      end_date: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("salesReportQuerySchema", () => {
  it("accepts valid query with all fields", () => {
    const result = salesReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      frequency: "weekly",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frequency).toBe("weekly");
    }
  });

  it("defaults frequency to 'daily'", () => {
    const result = salesReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frequency).toBe("daily");
    }
  });

  it.each(REPORT_FREQUENCIES)("accepts frequency '%s'", (freq) => {
    const result = salesReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      frequency: freq,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid frequency", () => {
    const result = salesReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      frequency: "biweekly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects end_date before start_date", () => {
    const result = salesReportQuerySchema.safeParse({
      start_date: "2026-09-13",
      end_date: "2026-09-01",
      frequency: "daily",
    });
    expect(result.success).toBe(false);
  });
});

describe("performanceReportQuerySchema", () => {
  it("accepts valid query with all fields", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      top_products: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.top_products).toBe(10);
    }
  });

  it("defaults top_products to 5", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.top_products).toBe(5);
    }
  });

  it("coerces string top_products to number", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      top_products: "7",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.top_products).toBe(7);
    }
  });

  it("rejects top_products < 1", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      top_products: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects top_products > 50", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      top_products: 51,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer top_products", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-01",
      end_date: "2026-09-13",
      top_products: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects end_date before start_date", () => {
    const result = performanceReportQuerySchema.safeParse({
      start_date: "2026-09-13",
      end_date: "2026-09-01",
      top_products: 5,
    });
    expect(result.success).toBe(false);
  });
});


