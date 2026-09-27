import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { OrderCard } from "@/components/manage/orders/order-card";
import { OrderDetailModal } from "@/components/manage/orders/order-detail-modal";
import { ToastProvider } from "@/components/ui/toast";
import type { CartLine } from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import type { OrderData } from "@/types/staff-order";
import { submitCart } from "@/lib/actions/cart";
import { getSeniorPwdIdPhotoUrl } from "@/lib/actions/orders";

const push = vi.fn();
const refresh = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace }),
}));

vi.mock("@/lib/actions/cart", () => ({
  submitCart: vi.fn(),
}));

vi.mock("@/lib/actions/orders", () => ({
  getSeniorPwdIdPhotoUrl: vi.fn(),
}));

const mockUpload = vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null });
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "11111111-1111-1111-1111-111111111111" } },
  error: null,
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
    channel: () => {
      const ch: any = {
        on: () => ch,
        subscribe: () => ch,
      };
      return ch;
    },
    removeChannel: () => Promise.resolve(),
  }),
}));

const profile: CustomerProfile = {
  firstName: "Ben",
  lastName: "Santos",
  name: "Ben Santos",
  mobile: "09175550123",
  email: "ben@example.com",
  passwordLastUpdated: null,
  profileImageUrl: null,
  memberSince: null,
  orderCount: 0,
};

// ₱112 line (e.g. 1 Yang Chow Fried Rice)
const lines112: CartLine[] = [
  {
    id: "item-1",
    name: "Yang Chow Fried Rice",
    unitPrice: 112,
    quantity: 1,
    specialInstructions: null,
  },
];

describe("Senior Citizen / PWD discount at checkout (#116 ticket 03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A ₱112 order with the discount shows: VAT exempt ₱0, discount ₱20, total ₱80", () => {
    render(
      <ToastProvider>
        <CheckoutScreen
          profile={profile}
          cartId="cart-123"
          lines={lines112}
          fulfilment="pickup"
          placedAtLabel="Today at 12:00 PM"
          arrivalEstimate="15–20 min"
        />
      </ToastProvider>,
    );

    // Initial state: normal VAT split
    expect(screen.getByText("VATable sales")).toBeInTheDocument();
    expect(screen.getByText("VAT (12%)")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Place order · ₱112/ })).toBeInTheDocument();

    // Toggle Senior / PWD discount checkbox
    const discountToggle = screen.getByRole("checkbox", {
      name: /Apply Senior Citizen or PWD discount/i,
    });
    fireEvent.click(discountToggle);

    // After enabling discount:
    // "A ₱112 order with the discount shows: VAT exempt ₱0, discount ₱20, total ₱80."
    expect(screen.getByText("VAT exempt")).toBeInTheDocument();
    expect(screen.getByText("₱0")).toBeInTheDocument();
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("₱20")).toBeInTheDocument();
    expect(screen.getByText("₱80")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Place order · ₱80/ })).toBeInTheDocument();
  });

  it("refuses a photo over 2MB with a clear message", () => {
    render(
      <ToastProvider>
        <CheckoutScreen
          profile={profile}
          cartId="cart-123"
          lines={lines112}
          fulfilment="pickup"
          placedAtLabel="Today at 12:00 PM"
          arrivalEstimate="15–20 min"
        />
      </ToastProvider>,
    );

    const discountToggle = screen.getByRole("checkbox", {
      name: /Apply Senior Citizen or PWD discount/i,
    });
    fireEvent.click(discountToggle);

    // Create a 2.5 MB dummy file
    const oversizedFile = new File(["a".repeat(2.5 * 1024 * 1024)], "id-card-large.jpg", {
      type: "image/jpeg",
    });

    const fileInput = document.querySelector("#discount-id-photo") as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByText(/The photo must be 2 MB or smaller/i)).toBeInTheDocument();
  });

  it("validates required fields and uploads the ID photo on order placement", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: {
        order_id: "order-999",
        order_status: "pending",
        cart_id: "cart-123",
        is_final: true,
      },
      error: null,
    });

    render(
      <ToastProvider>
        <CheckoutScreen
          profile={profile}
          cartId="cart-123"
          lines={lines112}
          fulfilment="pickup"
          placedAtLabel="Today at 12:00 PM"
          arrivalEstimate="15–20 min"
        />
      </ToastProvider>,
    );

    const discountToggle = screen.getByRole("checkbox", {
      name: /Apply Senior Citizen or PWD discount/i,
    });
    fireEvent.click(discountToggle);

    // Fill in ID details
    const idInput = screen.getByLabelText(/ID number/i);
    const nameInput = screen.getByLabelText(/Name on ID/i);
    fireEvent.change(idInput, { target: { value: "OSCA-98765" } });
    fireEvent.change(nameInput, { target: { value: "Ben Santos" } });

    // Attach valid 500 KB photo
    const validFile = new File(["a".repeat(500 * 1024)], "ben-senior-id.jpg", {
      type: "image/jpeg",
    });
    const fileInput = document.querySelector("#discount-id-photo") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Place order
    const placeOrderBtn = screen.getByRole("button", { name: /Place order · ₱80/ });
    fireEvent.click(placeOrderBtn);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(submitCart).toHaveBeenCalledWith(
        expect.objectContaining({
          discount: expect.objectContaining({
            type: "senior_citizen",
            id_number: "OSCA-98765",
            name_on_id: "Ben Santos",
            photo_path: expect.stringContaining("11111111-1111-1111-1111-111111111111/"),
          }),
        }),
      );
      expect(push).toHaveBeenCalledWith("/checkout/confirmation?order=order-999");
    });
  });
});

describe("Staff order view — Senior Citizen / PWD verification (#116 ticket 03)", () => {
  const sampleStaffOrder: OrderData = {
    id: "order-101",
    orderNumber: "84729102",
    time: "12:30 PM",
    status: "QUEUE",
    timer: "15:00",
    deliveryFee: 0,
    total: 80,
    items: [
      {
        name: "Yang Chow Fried Rice",
        quantity: 1,
        price: 80,
      },
    ],
    contactInfo: {
      name: "Ben Santos",
      phone: "09175550123",
    },
    orderInfo: {
      type: "Take out",
      specialInstructions: "",
    },
    seniorPwd: {
      type: "senior_citizen",
      idNumber: "OSCA-98765",
      nameOnId: "Ben Santos",
      discount: 20,
      hasPhoto: true,
    },
  };

  it("shows Verify ID badge on the OrderCard", () => {
    render(<OrderCard order={sampleStaffOrder} />);

    expect(screen.getByText(/Verify ID · Senior Citizen/i)).toBeInTheDocument();
    expect(screen.getByText(/−₱20.00/)).toBeInTheDocument();
  });

  it("shows Verify ID section in OrderDetailModal and lets staff inspect the ID photo", async () => {
    vi.mocked(getSeniorPwdIdPhotoUrl).mockResolvedValue({
      data: { url: "https://example.com/signed-id-photo.jpg" },
      error: null,
    });

    render(
      <OrderDetailModal
        order={sampleStaffOrder}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Verify ID — Senior Citizen/i)).toBeInTheDocument();
    expect(screen.getByText("OSCA-98765")).toBeInTheDocument();
    expect(screen.getAllByText("Ben Santos").length).toBeGreaterThanOrEqual(1);

    const viewPhotoBtn = screen.getByRole("button", { name: /View ID Photo/i });
    expect(viewPhotoBtn).toBeInTheDocument();

    fireEvent.click(viewPhotoBtn);

    await waitFor(() => {
      expect(getSeniorPwdIdPhotoUrl).toHaveBeenCalledWith("order-101");
      const img = screen.getByAltText(/Senior Citizen or PWD ID photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/signed-id-photo.jpg");
    });
  });
});
