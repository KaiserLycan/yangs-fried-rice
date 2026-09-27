import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CASH_LIMIT,
  FIRST_CASH_LIMIT,
  MAX_TIP,
  MIN_ORDER,
  NO_SHOW_CASH_BLOCK,
  NO_SHOW_REASONS,
  amountToMinimum,
  changeDue,
  payInStoreBlock,
} from "@/lib/checkout/order-rules";
import { fallbackStoreStatus, storeBlockFor } from "@/lib/store/store-status";

const MIGRATION = readFileSync("supabase/migrations/20260929110000_finale_business_rules.sql", "utf8");

describe("the checkout rules match submit_cart_to_order", () => {
  it("uses the same numbers", () => {
    expect(MIGRATION).toContain(`IF v_cart_total < ${MIN_ORDER} THEN`);
    expect(MIGRATION).toContain(`IF v_due + v_tip > ${CASH_LIMIT} THEN`);
    expect(MIGRATION).toContain(`IF v_paid_cash = 0 AND v_due + v_tip > ${FIRST_CASH_LIMIT} THEN`);
    expect(MIGRATION).toContain(`IF v_strikes >= ${NO_SHOW_CASH_BLOCK} THEN`);
    expect(MIGRATION).toContain(`IF v_tip < 0 OR v_tip > ${MAX_TIP} THEN`);
  });

  it("allows exactly the no-show reasons staff can pick", () => {
    const reasons = Object.keys(NO_SHOW_REASONS).map((r) => `'${r}'`).join(", ");
    expect(MIGRATION).toContain(`no_show_reason IN (${reasons})`);
  });
});

describe("minimum order", () => {
  it("says how much more is needed", () => {
    expect(amountToMinimum(30)).toBe(120);
    expect(amountToMinimum(149.5)).toBe(0.5);
    expect(amountToMinimum(150)).toBe(0);
    expect(amountToMinimum(500)).toBe(0);
  });
});

describe("pay in store", () => {
  const good = { completedCashOrders: 3, noShows: 0 };

  it("is open to a customer with a good record", () => {
    expect(payInStoreBlock({ total: 1500, ...good })).toBeNull();
  });

  it("is closed after two missed pick-ups, whatever the amount", () => {
    expect(payInStoreBlock({ total: 200, completedCashOrders: 5, noShows: 2 })).toMatch(/2 missed pick-ups/);
  });

  it("is capped for big orders and for a first cash order", () => {
    expect(payInStoreBlock({ total: CASH_LIMIT + 1, ...good })).toMatch(/GCash or Maya/);
    expect(payInStoreBlock({ total: FIRST_CASH_LIMIT + 1, completedCashOrders: 0, noShows: 0 })).toMatch(/first/);
    expect(payInStoreBlock({ total: FIRST_CASH_LIMIT, completedCashOrders: 0, noShows: 0 })).toBeNull();
  });

  it("works out the change", () => {
    expect(changeDue(430, 1000)).toBe(570);
    expect(changeDue(430, null)).toBeNull();
    expect(changeDue(430, 400)).toBe(0);
  });
});

describe("last orders (L1)", () => {
  it("refuses after the cut-off and says when it was", () => {
    const status = { ...fallbackStoreStatus(), isOpen: true, isAccepting: false, lastOrderTime: "17:30", openTime: "08:00" };
    expect(storeBlockFor(status)).toEqual({
      code: "STORE_CLOSED",
      message: "Last orders were at 5:30 PM today. We open again at 8:00 AM.",
    });
  });

  it("still takes orders before it", () => {
    expect(storeBlockFor({ ...fallbackStoreStatus(), isOpen: true, isAccepting: true })).toBeNull();
  });
});
