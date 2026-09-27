import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ rpc }) }));

import { readPublicOrderTracking } from "@/lib/actions/public-tracking";

const ORDER = "68245140-9196-4640-a752-476033b67e63";
const TOKEN = "96660f4e-a4af-4de2-842b-4974db82f45c";

describe("public order tracking link", () => {
  it("never asks the database about a malformed link", async () => {
    expect(await readPublicOrderTracking("not-an-id", TOKEN)).toBeNull();
    expect(await readPublicOrderTracking(ORDER, "' or 1=1 --")).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns nothing when the token doesn't match", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await readPublicOrderTracking(ORDER, TOKEN)).toBeNull();
    expect(rpc).toHaveBeenCalledWith("get_public_order_tracking", { p_order_id: ORDER, p_token: TOKEN });
  });

  it("maps the order without anything personal in it", async () => {
    rpc.mockResolvedValueOnce({
      data: {
        order_id: ORDER,
        order_number: 1241,
        order_status: "ready",
        order_type: "take_out",
        cancelled_at: null,
        cancellation_reason: null,
        created_at: "2026-09-28T17:28:00Z",
        completed_at: null,
        pending_at: null,
        promised_at: "2026-09-28T18:03:00Z",
        ready_at: "2026-09-28T18:56:00Z",
        items: [{ name: "Garlic Beef Fried Rice", quantity: 2, subtotal: "430.00" }],
        status_log: [{ to_status: "pending", changed_at: "2026-09-28T17:28:00Z" }],
        payment: { method: "pay_in_store", status: "pending", due: "450.00" },
      },
      error: null,
    });
    const order = await readPublicOrderTracking(ORDER, TOKEN);
    expect(order?.orderNumber).toBe("1241");
    expect(order?.items[0].subtotal).toBe(430);
    expect(order?.payment?.due).toBe(450);
    expect(JSON.stringify(order)).not.toMatch(/customer|phone|email|name_on_id/);
  });
});
