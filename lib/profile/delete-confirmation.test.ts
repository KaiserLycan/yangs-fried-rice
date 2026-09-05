import { describe, expect, it } from "vitest";
import {
  DELETE_CONFIRMATION_WORD,
  isDeleteConfirmed,
} from "./delete-confirmation";

describe("isDeleteConfirmed", () => {
  it("accepts the exact confirmation word", () => {
    expect(isDeleteConfirmed(DELETE_CONFIRMATION_WORD)).toBe(true);
  });

  it("ignores whitespace either side, which is what a paste leaves behind", () => {
    expect(isDeleteConfirmed("  DELETE  ")).toBe(true);
  });

  // Deliberately case-sensitive. The gate exists to make the customer stop
  // and type something on purpose, and lower-casing it removes that pause.
  it("rejects the word in the wrong case", () => {
    expect(isDeleteConfirmed("delete")).toBe(false);
    expect(isDeleteConfirmed("Delete")).toBe(false);
  });

  it("rejects anything that merely contains the word", () => {
    expect(isDeleteConfirmed("DELETE ME")).toBe(false);
    expect(isDeleteConfirmed("PLEASE DELETE")).toBe(false);
  });

  it("rejects an empty field", () => {
    expect(isDeleteConfirmed("")).toBe(false);
    expect(isDeleteConfirmed("   ")).toBe(false);
  });
});
