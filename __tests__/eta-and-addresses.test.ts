import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET as getAddresses, POST as postAddress } from "@/app/api/customer/addresses/route";
import { GET as getOrderEta, POST as postOrderEta } from "@/app/api/orders/[id]/eta/route";

describe("Customer Addresses API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-ADDR-1: Rejects unauthenticated requests with 401", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const res = await getAddresses();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("TC-ADDR-2: Rejects address outside NCR with 400", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-1" } } }),
      },
    });

    const request = new Request("http://localhost:3000/api/customer/addresses", {
      method: "POST",
      body: JSON.stringify({
        label: "Beach House",
        buildingNo: "12",
        street: "Osmena Blvd",
        barangay: "Barangay Uno",
        city: "Cebu City",
        zip: "6000",
      }),
    });

    const res = await postAddress(request);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Delivery is currently restricted to Metro Manila (NCR)");
  });

  it("TC-ADDR-3: Successfully saves valid NCR address with 201", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            address_id: "addr-123",
            customer_id: "cust-1",
            label: "Home",
            address_details: "Unit 201, Taft Avenue, Malate, Manila",
            address_note: "Ring doorbell",
            is_default: false,
          },
          error: null,
        }),
      }),
    });

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-1" } } }),
      },
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    });

    const request = new Request("http://localhost:3000/api/customer/addresses", {
      method: "POST",
      body: JSON.stringify({
        label: "Home",
        buildingNo: "Unit 201",
        street: "Taft Avenue",
        barangay: "Malate",
        city: "Manila",
        zip: "1004",
        deliveryNote: "Ring doorbell",
      }),
    });

    const res = await postAddress(request);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe("Address successfully added.");
    expect(body.address.address_id).toBe("addr-123");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        building_no: "Unit 201",
        street: "Taft Avenue",
        barangay: "Malate",
        city: "Manila",
        zip_code: "1004",
      }),
    );
  });

  it("TC-ADDR-4: Names every invalid address part in fieldErrors", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-1" } } }),
      },
    });

    const request = new Request("http://localhost:3000/api/customer/addresses", {
      method: "POST",
      body: JSON.stringify({ buildingNo: "", street: "Ta", barangay: "Malate", city: "Manila", zip: "10" }),
    });

    const res = await postAddress(request);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual(["buildingNo", "street", "zip"]);
  });
});

describe("ETA API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-ETA-1: Returns 404 when order does not exist", async () => {
    (createClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      }),
    });

    const res = await getOrderEta(new Request("http://localhost:3000/api/orders/non-existent/eta"), {
      params: { id: "non-existent" },
    });

    expect(res.status).toBe(404);
  });

  it("TC-ETA-2: Calculates ETA with kitchen queue and transit distance", async () => {
    const mockOrder = {
      order_id: "order-456",
      customer_id: "cust-1",
      order_status: "preparing",
      order_type: "delivery",
      created_at: new Date().toISOString(),
    };

    const mockDelivery = {
      delivery_id: "deliv-1",
      delivery_status: "pending",
      estimated_time: "20–30 mins",
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-1" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "order") {
          return {
            select: vi.fn().mockImplementation((cols: string, opts?: any) => {
              if (opts?.count === "exact") {
                return {
                  in: vi.fn().mockReturnValue({
                    lt: vi.fn().mockResolvedValue({ count: 2 }), // 2 orders ahead in queue
                  }),
                };
              }
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
                }),
              };
            }),
          };
        }
        if (table === "delivery") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockDelivery }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === "customer_address") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { address_details: "Taft Ave, Malate, Manila" },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    });

    const request = new Request("http://localhost:3000/api/orders/order-456/eta", {
      method: "POST",
      body: JSON.stringify({
        latitude: 14.5547, // Makati (~4.4 km)
        longitude: 121.0244,
      }),
    });

    const res = await postOrderEta(request, { params: { id: "order-456" } });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.orderId).toBe("order-456");
    expect(body.kitchenPrepMinutes).toBe(21); // 15 base + 2 * 3
    expect(body.activeOrdersAhead).toBe(2);
    expect(body.isDeliverable).toBe(true);
    expect(body.arrivalWindow).toBeDefined();
    // Pickup-only (issue #114): the delivery table is gone, so the estimate
    // is computed and returned, never written back anywhere.
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("TC-ETA-3: Rejects with 404 Order not found when order belongs to another customer", async () => {
    const otherOrder = {
      order_id: "order-secret-999",
      customer_id: "other-customer-id",
      order_status: "preparing",
      order_type: "delivery",
      created_at: new Date().toISOString(),
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cust-attacker-id" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "order") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: otherOrder, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    });

    const res = await getOrderEta(
      new Request("http://localhost:3000/api/orders/order-secret-999/eta"),
      { params: { id: "order-secret-999" } }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Order not found.");
  });

  it("TC-ETA-4: Rejects with 404 Order not found when requester is unauthenticated", async () => {
    const existingOrder = {
      order_id: "order-123",
      customer_id: "cust-owner",
      order_status: "preparing",
      order_type: "delivery",
      created_at: new Date().toISOString(),
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "order") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: existingOrder, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    });

    const res = await getOrderEta(
      new Request("http://localhost:3000/api/orders/order-123/eta"),
      { params: { id: "order-123" } }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Order not found.");
  });
});
