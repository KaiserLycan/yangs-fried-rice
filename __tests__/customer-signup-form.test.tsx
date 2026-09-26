import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { useRouter, useSearchParams } from "next/navigation";
import { registerCustomer } from "@/app/(auth)/actions";

// 1. Mock the Next.js navigation hooks using Vitest (vi)
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// 2. Mock the Backend Server Action
vi.mock("@/app/(auth)/actions", () => ({
  registerCustomer: vi.fn(),
}));

describe("US-01: CustomerSignupForm Validations", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush, refresh: vi.fn() });
    (useSearchParams as any).mockReturnValue({ get: vi.fn(() => "/") });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ valid: true, message: "Address validated." }),
      }),
    );
  });

  it("TC-1.1.U-A: Keeps the action disabled until the required form data is complete", async () => {
    render(<CustomerSignupForm />);

    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeDisabled();
    expect(registerCustomer).not.toHaveBeenCalled();
  });

  it("TC-1.1.I: Successfully submits valid data and redirects user", async () => {
    (registerCustomer as any).mockResolvedValue({ success: true });

    render(<CustomerSignupForm />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Liza" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Reyes" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "liza@example.com" } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: "09171234567" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Yangs!Pass2026" } });
    fireEvent.change(screen.getByLabelText(/building \/ house no\./i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/street/i), { target: { value: "Mapúa Ave" } });
    fireEvent.change(screen.getByLabelText(/barangay/i), { target: { value: "San Andres" } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Manila" } });
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /i have read and agree to the terms & policy/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create account/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(registerCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Liza",
          lastName: "Reyes",
          email: "liza@example.com",
          phone: "+639171234567",
          password: "Yangs!Pass2026",
          buildingNo: "123",
          street: "Mapúa Ave",
          barangay: "San Andres",
          city: "Manila",
          zip: "1000",
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("TC-1.1.U-D: Displays server errors correctly", async () => {
    (registerCustomer as any).mockResolvedValue({
      success: false,
      error: "An account with this email already exists.",
    });

    render(<CustomerSignupForm />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "duplicate@example.com" } });
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: "09171234567" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Yangs!Pass2026" } });
    fireEvent.change(screen.getByLabelText(/building \/ house no\./i), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/street/i), { target: { value: "Mapúa Ave" } });
    fireEvent.change(screen.getByLabelText(/barangay/i), { target: { value: "San Andres" } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Manila" } });
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /i have read and agree to the terms & policy/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create account/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/An account with this email already exists/i)).toBeInTheDocument();
    });
  });
});