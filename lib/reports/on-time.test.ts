import { describe, expect, it } from "vitest";
import { summariseOnTime } from "@/lib/reports/on-time";

const at = (minute: number) => new Date(Date.UTC(2026, 8, 28, 4, minute)).toISOString();

describe("summariseOnTime (FINALE 4.3)", () => {
  it("counts an order ready by the promise, within a minute's grace, as on time", () => {
    const summary = summariseOnTime([
      { promised_at: at(30), ready_at: at(25) },
      { promised_at: at(30), ready_at: at(31) },
      { promised_at: at(30), ready_at: at(40) },
      { promised_at: at(30), ready_at: at(50) },
    ]);
    expect(summary).toEqual({ measured: 4, onTimeRate: 50, averageMinutesLate: 15 });
  });

  it("skips orders missing either time", () => {
    expect(
      summariseOnTime([
        { promised_at: null, ready_at: at(5) },
        { promised_at: at(5), ready_at: null },
      ]),
    ).toEqual({ measured: 0, onTimeRate: null, averageMinutesLate: null });
  });
});
