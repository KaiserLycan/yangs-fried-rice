import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password-strength";

describe("passwordStrength", () => {
  it("scores an empty password as Weak", () => {
    expect(passwordStrength("")).toEqual({ label: "Weak", percent: 25 });
  });

  it("scores a short lowercase-only password as Weak", () => {
    expect(passwordStrength("abcde")).toEqual({ label: "Weak", percent: 25 });
  });

  // Meets only the shared 8-character minimum and nothing else — one point.
  it("scores eight lowercase letters as Weak", () => {
    expect(passwordStrength("password")).toEqual({
      label: "Weak",
      percent: 25,
    });
  });

  // Length (1) + mixed case (1) = two points.
  it("scores a mixed-case eight-character password as Fair", () => {
    expect(passwordStrength("Password")).toEqual({
      label: "Fair",
      percent: 50,
    });
  });

  // Length (1) + mixed case (1) + digit (1) = three points.
  it("scores a mixed-case password with a digit as Good", () => {
    expect(passwordStrength("Password1")).toEqual({
      label: "Good",
      percent: 75,
    });
  });

  // Length (1) + mixed case (1) + digit (1) + symbol (1) = four points.
  it("scores a mixed-case password with a digit and a symbol as Strong", () => {
    expect(passwordStrength("Password1!")).toEqual({
      label: "Strong",
      percent: 100,
    });
  });

  // All five signals, comfortably past both length thresholds.
  it("scores a long password with every signal as Strong", () => {
    expect(passwordStrength("P@ssw0rd-Long-Enough-12")).toEqual({
      label: "Strong",
      percent: 100,
    });
  });

  it("never blocks on its own — it only advises", () => {
    // The function has no notion of pass/fail; it always returns a label.
    // The one real gate is customerPasswordSchema's minimum length.
    expect(passwordStrength("x").label).toBeDefined();
  });
});
