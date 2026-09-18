import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { startWalletPayment } from "@/lib/checkout/paymongo";

const invoke = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ functions: { invoke } }),
}));

/**
 * The wallet flow is three network calls in a row (GitHub #9). These pin
 * down the order, what each is told, and that every failure surfaces as a
 * message a customer can read rather than a generic one.
 */

const fetchMock = vi.fn();

function paymongoReplies(attachAttributes: Record<string, unknown>) {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "pm_1" } }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { attributes: attachAttributes } }),
    });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY", "pk_test_x");
  vi.stubGlobal("fetch", fetchMock);
  invoke.mockResolvedValue({
    data: { payment_intent_id: "pi_1", client_key: "pi_1_client_k" },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const start = () =>
  startWalletPayment({
    orderId: "order-1",
    wallet: "gcash",
    returnUrl: "https://example.test/checkout/confirmation?order=order-1",
  });

describe("startWalletPayment", () => {
  it("asks the backend for the intent, then attaches a wallet and hands back the redirect", async () => {
    paymongoReplies({
      status: "awaiting_next_action",
      next_action: { redirect: { url: "https://gcash.test/pay" } },
    });

    await expect(start()).resolves.toEqual({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });

    expect(invoke).toHaveBeenCalledWith("create-payment-intent", {
      body: { order_id: "order-1" },
    });

    const [methodUrl, methodInit] = fetchMock.mock.calls[0];
    expect(methodUrl).toBe("https://api.paymongo.com/v1/payment_methods");
    expect(JSON.parse(methodInit.body)).toEqual({
      data: { attributes: { type: "gcash" } },
    });
    // Public key only — the secret must never be sent from the browser.
    expect(methodInit.headers.Authorization).toBe(
      `Basic ${btoa("pk_test_x:")}`,
    );

    const [attachUrl, attachInit] = fetchMock.mock.calls[1];
    expect(attachUrl).toBe(
      "https://api.paymongo.com/v1/payment_intents/pi_1/attach",
    );
    expect(JSON.parse(attachInit.body).data.attributes).toEqual({
      payment_method: "pm_1",
      client_key: "pi_1_client_k",
      return_url: "https://example.test/checkout/confirmation?order=order-1",
    });
  });

  it("surfaces the edge function's own reason when it refuses", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError({
        json: async () => ({ error: "This order has already been paid." }),
      } as unknown as Response),
    });

    await expect(start()).rejects.toThrow("This order has already been paid.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces PayMongo's reason when the gateway refuses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ detail: "Amount below minimum." }] }),
    });

    await expect(start()).rejects.toThrow("Amount below minimum.");
  });

  it("treats an attach that ends without a redirect as a refusal", async () => {
    paymongoReplies({
      status: "awaiting_payment_method",
      last_payment_error: { failed_message: "Wallet declined." },
    });

    await expect(start()).rejects.toThrow("Wallet declined.");
  });

  it("reports a processing attach as pending, not as a refusal", async () => {
    paymongoReplies({ status: "processing" });

    await expect(start()).resolves.toEqual({ kind: "pending" });
  });

  it("refuses up front when the public key is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY", "");

    await expect(start()).rejects.toThrow(/isn’t set up/);
    expect(invoke).not.toHaveBeenCalled();
  });
});
