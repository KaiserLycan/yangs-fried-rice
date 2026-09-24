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

import { loginCustomer } from "@/app/(auth)/actions";

const credentials = { email: "admin@yangs.ph", password: "correct-password" };

describe("customer login refuses accounts that aren't customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  it("signs an administrator with no customer row straight back out", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await loginCustomer(credentials);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/isn't a customer account/i);
    expect(signOut).toHaveBeenCalledTimes(1);
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
