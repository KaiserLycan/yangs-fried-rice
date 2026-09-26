import { describe, expect, it } from "vitest";
import {
  MAX_FAILURES_PER_EMAIL,
  WINDOW_MINUTES,
  clientIpFrom,
  emailKey,
  gateFromFailures,
  lockedOutMessage,
} from "@/lib/auth/login-rate-limit";

const NOW = new Date("2026-09-26T12:00:00Z");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

describe("gateFromFailures", () => {
  it("allows sign-in below the limit", () => {
    const failures = [1, 2, 3, 4].map(minutesAgo);
    expect(gateFromFailures(failures, MAX_FAILURES_PER_EMAIL, NOW)).toEqual({ allowed: true });
  });

  it("locks at the limit until the oldest counted failure leaves the window", () => {
    // Five failures, the oldest 5 minutes ago: locked for the remaining 10.
    const failures = [5, 4, 3, 2, 1].map(minutesAgo);
    expect(gateFromFailures(failures, MAX_FAILURES_PER_EMAIL, NOW)).toEqual({
      allowed: false,
      retryAfterMinutes: WINDOW_MINUTES - 5,
    });
  });

  it("ignores failures older than the window", () => {
    const failures = [40, 30, 20, 3, 2, 1].map(minutesAgo);
    expect(gateFromFailures(failures, MAX_FAILURES_PER_EMAIL, NOW)).toEqual({ allowed: true });
  });

  it("measures the wait from the limit-th newest failure, not the oldest", () => {
    // Seven recent failures; dropping below five needs the 5th newest (at
    // 10 minutes ago) to expire, which is 5 minutes away.
    const failures = [14, 12, 10, 4, 3, 2, 1].map(minutesAgo);
    const gate = gateFromFailures(failures, MAX_FAILURES_PER_EMAIL, NOW);
    expect(gate).toEqual({ allowed: false, retryAfterMinutes: 5 });
  });

  it("never asks for less than a minute", () => {
    const failures = [14.99, 3, 2, 1, 0].map(minutesAgo);
    const gate = gateFromFailures(failures, MAX_FAILURES_PER_EMAIL, NOW);
    expect(gate).toEqual({ allowed: false, retryAfterMinutes: 1 });
  });
});

describe("helpers", () => {
  it("keys an email case- and whitespace-insensitively, without storing it", () => {
    expect(emailKey(" Ana@Example.com ")).toBe(emailKey("ana@example.com"));
    expect(emailKey("ana@example.com")).not.toContain("ana");
    expect(emailKey("ana@example.com")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("takes the client IP from the first x-forwarded-for entry", () => {
    expect(clientIpFrom("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7");
    expect(clientIpFrom(null)).toBeNull();
    expect(clientIpFrom("")).toBeNull();
  });

  it("points the locked-out user at the reset path", () => {
    expect(lockedOutMessage({ allowed: false, retryAfterMinutes: 1 })).toBe(
      "Too many failed sign-in attempts. Try again in 1 minute, or reset your password.",
    );
    expect(lockedOutMessage({ allowed: false, retryAfterMinutes: 12 })).toContain("12 minutes");
  });
});
