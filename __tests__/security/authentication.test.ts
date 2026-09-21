/**
 * @vitest-environment node
 *
 * Runs in the Node environment, not jsdom: `jose` checks that the signing key
 * is a real `Uint8Array`, and jsdom's copy comes from a different realm, so an
 * otherwise valid key is rejected. That is a test-harness artefact — the app
 * itself runs this code in Node/Edge, never in a browser.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { loginSchema } from "@/lib/validation/login";
import { employeeLoginSchema } from "@/lib/validation/employee-login";
import { signupSchema } from "@/lib/validation/signup";
import { changePasswordSchema } from "@/lib/validation/admin";

/**
 * Authentication — Phase 4 section C.
 *
 * Two things are testable without a browser: what the login and password
 * rules accept, and whether the employee session cookie can be forged. The
 * cookie is the one that matters — `middleware.ts` lets a request into
 * /manage and /deliver on the strength of it alone.
 */

const SECRET = "test-employee-session-secret-that-is-long-enough";

let encrypt: typeof import("@/lib/auth/session").encrypt;
let decrypt: typeof import("@/lib/auth/session").decrypt;

beforeAll(async () => {
  process.env.EMPLOYEE_SESSION_SECRET = SECRET;
  const session = await import("@/lib/auth/session");
  encrypt = session.encrypt;
  decrypt = session.decrypt;
});

describe("C1. credential validation", () => {
  it("accepts a well-formed customer login", () => {
    expect(
      loginSchema.safeParse({ email: "liza@example.com", password: "securepassword123" }).success,
    ).toBe(true);
  });

  it("rejects empty login fields", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "liza@example.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "", password: "securepassword123" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    for (const email of ["abc", "abc@", "@example.com", "a b@example.com"]) {
      expect(loginSchema.safeParse({ email, password: "securepassword123" }).success).toBe(false);
    }
  });

  it("enforces a minimum password length on sign-up", () => {
    const base = {
      firstName: "Liza",
      lastName: "Reyes",
      email: "liza@example.com",
      phone: "+639171234567",
      buildingNo: "1",
      street: "Mapúa Ave",
      barangay: "San Andres",
      city: "Manila",
      zip: "1000",
    };
    expect(signupSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });

  it("enforces the same minimum when a manager sets a password", () => {
    expect(changePasswordSchema.safeParse({ new_password: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ new_password: "12345678" }).success).toBe(true);
  });

  it("requires an identifier and password for employee sign-in", () => {
    expect(employeeLoginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
});

describe("C2. the employee session cookie cannot be forged", () => {
  it("round-trips a session it issued itself", async () => {
    const token = await encrypt({ employee_id: "emp-1", role: "MANAGER" });
    await expect(decrypt(token)).resolves.toEqual(
      expect.objectContaining({ employee_id: "emp-1", role: "MANAGER" }),
    );
  });

  it("refuses a token signed with a different key", async () => {
    const forged = await new SignJWT({ employee_id: "attacker", role: "MANAGER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode("a-different-secret-entirely-abcdefghijk"));

    await expect(decrypt(forged)).resolves.toBeNull();
  });

  it("refuses a token whose payload was edited after signing", async () => {
    const token = await encrypt({ employee_id: "emp-1", role: "RIDER" });
    const [header, , signature] = token.split(".");
    const escalated = Buffer.from(
      JSON.stringify({ employee_id: "emp-1", role: "MANAGER" }),
    ).toString("base64url");

    await expect(decrypt(`${header}.${escalated}.${signature}`)).resolves.toBeNull();
  });

  it('refuses an unsigned "alg: none" token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ employee_id: "attacker", role: "MANAGER" }),
    ).toString("base64url");

    await expect(decrypt(`${header}.${payload}.`)).resolves.toBeNull();
  });

  it("refuses an expired session", async () => {
    const expired = await new SignJWT({ employee_id: "emp-1", role: "MANAGER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60 * 48)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60 * 60 * 24)
      .sign(new TextEncoder().encode(SECRET));

    await expect(decrypt(expired)).resolves.toBeNull();
  });

  it("refuses rubbish, and an empty cookie", async () => {
    for (const token of ["", "not-a-token", "a.b.c", "....."]) {
      await expect(decrypt(token)).resolves.toBeNull();
    }
  });

  it("refuses a correctly signed token that is not an employee session", async () => {
    const wrongShape = await new SignJWT({ hello: "world" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(SECRET));

    await expect(decrypt(wrongShape)).resolves.toBeNull();
  });
});

describe("C3. the signing key is never a public value", () => {
  it("refuses to issue a session when no server secret is configured", async () => {
    const saved = {
      secret: process.env.EMPLOYEE_SESSION_SECRET,
      service: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    delete process.env.EMPLOYEE_SESSION_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      // Fails closed. It used to fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // which is published in the browser bundle — anyone could have signed
      // their own "role: MANAGER" cookie with it.
      await expect(encrypt({ employee_id: "emp-1", role: "MANAGER" })).rejects.toThrow(
        /EMPLOYEE_SESSION_SECRET/,
      );
      // And a session cannot be read either, so nothing is trusted by accident.
      await expect(decrypt("anything")).resolves.toBeNull();
    } finally {
      if (saved.secret) process.env.EMPLOYEE_SESSION_SECRET = saved.secret;
      if (saved.service) process.env.SUPABASE_SERVICE_ROLE_KEY = saved.service;
    }
  });

  it("refuses a secret that is too short to be meaningful", async () => {
    const saved = process.env.EMPLOYEE_SESSION_SECRET;
    process.env.EMPLOYEE_SESSION_SECRET = "short";
    try {
      await expect(encrypt({ employee_id: "emp-1", role: "MANAGER" })).rejects.toThrow();
    } finally {
      process.env.EMPLOYEE_SESSION_SECRET = saved;
    }
  });
});
