import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";
import { FIELD_LIMITS } from "./fields";
import { contactGate, MAX_MESSAGES_PER_IP, CONTACT_WINDOW_MINUTES } from "@/lib/contact/contact-rate-limit";

const valid = {
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  phone: "",
  topic: "bulk",
  subject: "Party of 40",
  message: "Hi, we'd like fried rice trays for 40 people on Saturday.",
};

describe("contactSchema", () => {
  it("accepts a complete message, with or without a mobile number", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, phone: "962 693 9019" }).success).toBe(true);
  });

  it("rejects each field that is blank, malformed or out of bounds", () => {
    const bad: Array<[keyof typeof valid, string]> = [
      ["name", ""],
      ["name", "J"],
      ["name", "Juan123"],
      ["name", "x".repeat(FIELD_LIMITS.contactName.max + 1)],
      ["email", "not-an-email"],
      ["phone", "12345"],
      ["topic", "spam"],
      ["subject", "  "],
      ["subject", "x".repeat(FIELD_LIMITS.contactSubject.max + 1)],
      ["message", "too short"],
      ["message", "x".repeat(FIELD_LIMITS.contactMessage.max + 1)],
    ];
    for (const [field, value] of bad) {
      const result = contactSchema.safeParse({ ...valid, [field]: value });
      expect(result.success, `${field}=${JSON.stringify(value).slice(0, 30)}`).toBe(false);
      if (!result.success) expect(result.error.issues[0].path[0]).toBe(field);
    }
  });

  it("trims what it keeps", () => {
    const result = contactSchema.parse({ ...valid, name: "  Juan Dela Cruz  ", subject: " Party of 40 " });
    expect(result.name).toBe("Juan Dela Cruz");
    expect(result.subject).toBe("Party of 40");
  });
});

describe("contact rate limit", () => {
  const now = Date.now();
  const minute = 60_000;

  it("allows up to the limit inside the window", () => {
    const times = Array.from({ length: MAX_MESSAGES_PER_IP - 1 }, (_, i) => now - i * minute);
    expect(contactGate(times, now)).toEqual({ allowed: true });
  });

  it("blocks at the limit and says when it lifts", () => {
    const times = Array.from({ length: MAX_MESSAGES_PER_IP }, (_, i) => now - i * minute);
    const gate = contactGate(times, now);
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) {
      expect(gate.retryAfterMinutes).toBe(CONTACT_WINDOW_MINUTES - (MAX_MESSAGES_PER_IP - 1));
    }
  });

  it("forgets sends older than the window", () => {
    const old = Array.from({ length: MAX_MESSAGES_PER_IP }, () => now - (CONTACT_WINDOW_MINUTES + 1) * minute);
    expect(contactGate(old, now)).toEqual({ allowed: true });
  });
});
