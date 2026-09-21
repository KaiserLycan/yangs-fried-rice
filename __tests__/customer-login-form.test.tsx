import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerLoginForm } from "@/components/auth/customer-login-form";
import { useRouter, useSearchParams } from "next/navigation";
import { loginCustomer } from "@/app/(auth)/actions";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginCustomer: vi.fn(),
}));

describe("US-01: CustomerLoginForm Validations", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush, refresh: vi.fn() });
    (useSearchParams as any).mockReturnValue({ get: vi.fn(() => "/checkout") });
  });

  it("TC-1.2.U: Keeps the action disabled until both required fields are filled", async () => {
    render(<CustomerLoginForm />);

    const submitButton = screen.getByRole("button", { name: /log in/i });
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(loginCustomer).not.toHaveBeenCalled();
  });

  it("TC-1.2.I: Submits valid credentials and handles custom redirects", async () => {
    (loginCustomer as any).mockResolvedValue({ success: true });
    
    render(<CustomerLoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(loginCustomer).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/checkout"); 
    });
  });
});