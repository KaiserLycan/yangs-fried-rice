import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { exchangeCodeForSession, verifyOtp } }),
}));

import { GET } from "@/app/auth/confirm/route";

const call = async (query: string) => {
  const res = await GET(new Request(`https://shop.example/auth/confirm${query}`));
  return new URL(res.headers.get("location") ?? "");
};

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  verifyOtp.mockReset();
});

describe("GET /auth/confirm", () => {
  it("signs the customer in and lands them on the menu", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const to = await call("?code=abc&next=/menu");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(to.pathname).toBe("/menu");
  });

  it("accepts the token_hash style link too", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const to = await call("?token_hash=h&type=signup");
    expect(verifyOtp).toHaveBeenCalledWith({ type: "signup", token_hash: "h" });
    expect(to.pathname).toBe("/menu");
  });

  it("falls back to log in, keeping next, when the code can't be exchanged", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("no verifier") });
    const to = await call("?code=abc&next=/menu");
    expect(to.pathname).toBe("/login");
    expect(to.searchParams.get("confirmed")).toBe("1");
    expect(to.searchParams.get("next")).toBe("/menu");
  });

  it("never redirects off the site", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const to = await call("?code=abc&next=//evil.example");
    expect(to.origin).toBe("https://shop.example");
    expect(to.pathname).toBe("/menu");
  });
});
