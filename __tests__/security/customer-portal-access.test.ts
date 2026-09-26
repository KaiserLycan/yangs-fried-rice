import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Admins, staff and riders have Supabase Auth accounts too. Valid credentials
 * for one of those accounts must NOT open a customer session: the customer
 * portal is only for accounts with a row in `customer`.
 */

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const maybeSingle = vi.fn();
const deleteSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { signInWithPassword, signOut },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => maybeSingle(table),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
  deleteSession: () => deleteSession(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

// The action reads the caller's IP for rate limiting; there is no request
// scope in a unit test.
vi.mock("next/headers", () => ({
  headers: () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));

const checkLoginAllowed = vi.fn();
const recordLoginFailure = vi.fn();
vi.mock("@/lib/auth/login-rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/login-rate-limit")>();
  return {
    ...actual,
    checkLoginAllowed: (...args: unknown[]) => checkLoginAllowed(...args),
    recordLoginFailure: (...args: unknown[]) => recordLoginFailure(...args),
    clearLoginFailures: vi.fn(),
  };
});

import { loginCustomer } from "@/app/(auth)/actions";

const credentials = { email: "admin@yangs.ph", password: "correct-password" };

describe("customer login refuses accounts that aren't customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    checkLoginAllowed.mockResolvedValue({ allowed: true });
  });

  it("does not try the password at all while the email is locked out", async () => {
    checkLoginAllowed.mockResolvedValue({ allowed: false, retryAfterMinutes: 9 });

    const result = await loginCustomer(credentials);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/Too many failed sign-in attempts.*9 minutes.*reset your password/);
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(checkLoginAllowed).toHaveBeenCalledWith(credentials.email, "203.0.113.7");
  });

  it("counts a wrong password against the email and IP", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid" } });

    await loginCustomer(credentials);

    expect(recordLoginFailure).toHaveBeenCalledWith(credentials.email, "203.0.113.7");
  });

  it("signs an administrator with no customer row straight back out", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await loginCustomer(credentials);

    expect(result.success).toBe(false);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  /**
   * This assertion was inverted on purpose. It used to require the rejection
   * to say "isn't a customer account", which was the intended behaviour at
   * the time — name the right door rather than pretend the password was
   * wrong.
   *
   * Issue #106 rejected that: the credentials here are *correct*, so a
   * message that distinguishes this case from a bad password confirms both
   * that the address is registered and that it belongs to staff. That is
   * account enumeration with the privileged accounts helpfully labelled.
   * The reply must now be indistinguishable from a wrong password.
   */
  it("reveals nothing about the account it just refused", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const staffResult = await loginCustomer(credentials);

    // What a genuinely wrong password produces, for comparison.
    signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    const wrongPasswordResult = await loginCustomer(credentials);

    expect(staffResult.success).toBe(false);
    expect(wrongPasswordResult.success).toBe(false);
    if (!staffResult.success && !wrongPasswordResult.success) {
      expect(staffResult.error).toBe(wrongPasswordResult.error);
      expect(staffResult.error).not.toMatch(/customer account/i);
      expect(staffResult.error).not.toMatch(/staff|administrator|employee/i);
    }
  });

  it("refuses a disabled customer and signs them out", async () => {
    maybeSingle.mockResolvedValue({
      data: { customer_id: "user-1", is_account_disabled: true },
      error: null,
    });

    const result = await loginCustomer(credentials);

    expect(result.success).toBe(false);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("lets a real customer in and drops any stale employee session cookie", async () => {
    maybeSingle.mockResolvedValue({
      data: { customer_id: "user-1", is_account_disabled: false },
      error: null,
    });

    const result = await loginCustomer(credentials);

    expect(result).toEqual({ success: true });
    expect(signOut).not.toHaveBeenCalled();
    expect(deleteSession).toHaveBeenCalledTimes(1);
  });

  it("keeps the generic message for wrong credentials", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login" } });

    const result = await loginCustomer(credentials);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Incorrect email or password.");
    expect(maybeSingle).not.toHaveBeenCalled();
  });
});

describe("middleware keeps non-customers out of customer pages", () => {
  it("checks for a customer row before serving /cart, /checkout, /orders or /profile", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("middleware.ts", "utf8");
    expect(source).toMatch(/isCustomerArea && user/);
    expect(source).toMatch(/\.from\("customer"\)/);
    expect(source).toMatch(/not-customer/);
  });
});
