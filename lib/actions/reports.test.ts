import { describe, it, expect } from "vitest";
import { groupByFrequency, dateToPeriod } from "./reports-utils";

// ---------------------------------------------------------------------------
// dateToPeriod — pure function, no DB needed
// ---------------------------------------------------------------------------

describe("dateToPeriod", () => {
  it("returns YYYY-MM-DD for daily", () => {
    expect(dateToPeriod("2026-09-13", "daily")).toBe("2026-09-13");
  });

  it("returns YYYY-Www for weekly", () => {
    // 2026-09-13 is a Sunday in ISO week 37
    const result = dateToPeriod("2026-09-13", "weekly");
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("returns YYYY-MM for monthly", () => {
    expect(dateToPeriod("2026-09-13", "monthly")).toBe("2026-09");
  });

  it("returns YYYY for yearly", () => {
    expect(dateToPeriod("2026-09-13", "yearly")).toBe("2026");
  });

  it("handles year boundary for weekly (Dec 31)", () => {
    // 2026-12-31 is a Thursday → ISO week 53 of 2026
    const result = dateToPeriod("2026-12-31", "weekly");
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("handles Jan 1 for monthly", () => {
    expect(dateToPeriod("2026-01-01", "monthly")).toBe("2026-01");
  });
});

// ---------------------------------------------------------------------------
// groupByFrequency — pure function, no DB needed
// ---------------------------------------------------------------------------

const SAMPLE_DAILY_ROWS = [
  { date: "2026-09-01", totalRevenue: 1000, totalOrders: 10 },
  { date: "2026-09-02", totalRevenue: 1500, totalOrders: 15 },
  { date: "2026-09-03", totalRevenue: 1200, totalOrders: 12 },
  { date: "2026-09-08", totalRevenue: 2000, totalOrders: 20 },
  { date: "2026-09-09", totalRevenue: 1800, totalOrders: 18 },
  { date: "2026-09-15", totalRevenue: 2500, totalOrders: 25 },
  { date: "2026-10-01", totalRevenue: 3000, totalOrders: 30 },
];

describe("groupByFrequency", () => {
  describe("daily", () => {
    it("returns one row per day (pass-through)", () => {
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "daily");
      expect(result).toHaveLength(7);
      expect(result[0].period).toBe("2026-09-01");
      expect(result[0].totalRevenue).toBe(1000);
      expect(result[0].totalOrders).toBe(10);
    });

    it("rows are sorted by period ascending", () => {
      const reversed = [...SAMPLE_DAILY_ROWS].reverse();
      const result = groupByFrequency(reversed, "daily");
      for (let i = 1; i < result.length; i++) {
        expect(result[i].period > result[i - 1].period).toBe(true);
      }
    });
  });

  describe("weekly", () => {
    it("groups days within the same ISO week", () => {
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "weekly");
      // Should have fewer rows than daily
      expect(result.length).toBeLessThan(SAMPLE_DAILY_ROWS.length);
      // Each period should match YYYY-Www format
      for (const row of result) {
        expect(row.period).toMatch(/^\d{4}-W\d{2}$/);
      }
    });

    it("sums revenue and orders within a week", () => {
      const twoSameWeekDays = [
        { date: "2026-09-07", totalRevenue: 100, totalOrders: 5 },
        { date: "2026-09-08", totalRevenue: 200, totalOrders: 10 },
      ];
      const result = groupByFrequency(twoSameWeekDays, "weekly");
      // Sep 7 (Mon) and Sep 8 (Tue) are in the same ISO week
      expect(result).toHaveLength(1);
      expect(result[0].totalRevenue).toBe(300);
      expect(result[0].totalOrders).toBe(15);
    });
  });

  describe("monthly", () => {
    it("groups days within the same month", () => {
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "monthly");
      // Sep rows + Oct row = 2 groups
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe("2026-09");
      expect(result[1].period).toBe("2026-10");
    });

    it("sums revenue and orders within a month", () => {
      const septemberRevenue = 1000 + 1500 + 1200 + 2000 + 1800 + 2500;
      const septemberOrders = 10 + 15 + 12 + 20 + 18 + 25;
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "monthly");
      expect(result[0].totalRevenue).toBe(septemberRevenue);
      expect(result[0].totalOrders).toBe(septemberOrders);
    });
  });

  describe("yearly", () => {
    it("groups all days in the same year", () => {
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "yearly");
      // All rows are in 2026
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe("2026");
    });

    it("separates different years", () => {
      const multiYear = [
        { date: "2025-12-31", totalRevenue: 500, totalOrders: 5 },
        { date: "2026-01-01", totalRevenue: 600, totalOrders: 6 },
      ];
      const result = groupByFrequency(multiYear, "yearly");
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe("2025");
      expect(result[1].period).toBe("2026");
    });

    it("sums revenue and orders across all days in a year", () => {
      const totalRevenue = SAMPLE_DAILY_ROWS.reduce((s, r) => s + r.totalRevenue, 0);
      const totalOrders = SAMPLE_DAILY_ROWS.reduce((s, r) => s + r.totalOrders, 0);
      const result = groupByFrequency(SAMPLE_DAILY_ROWS, "yearly");
      expect(result[0].totalRevenue).toBe(totalRevenue);
      expect(result[0].totalOrders).toBe(totalOrders);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      const result = groupByFrequency([], "daily");
      expect(result).toHaveLength(0);
    });

    it("handles a single day", () => {
      const single = [{ date: "2026-09-01", totalRevenue: 100, totalOrders: 1 }];
      const result = groupByFrequency(single, "monthly");
      expect(result).toHaveLength(1);
      expect(result[0].totalRevenue).toBe(100);
    });

    it("rounds revenue to 2 decimal places", () => {
      const rows = [
        { date: "2026-09-01", totalRevenue: 33.333, totalOrders: 1 },
        { date: "2026-09-02", totalRevenue: 33.333, totalOrders: 1 },
        { date: "2026-09-03", totalRevenue: 33.334, totalOrders: 1 },
      ];
      const result = groupByFrequency(rows, "monthly");
      // 33.333 + 33.333 + 33.334 = 100.0
      expect(result[0].totalRevenue).toBe(100);
    });
  });
});
