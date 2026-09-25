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

  /**
   * Issue #106: signing in with an admin account said "This account isn't a
   * customer account. Staff and administrators sign in at the employee
   * login." That confirms the address is registered AND that it belongs to
   * staff — a login form should not answer either question.
   */
  it("TC-1.2.S: a staff account gets the same rejection as a wrong password", async () => {
    (loginCustomer as any).mockResolvedValue({
      success: false,
      error: "Incorrect email or password.",
    });

    render(<CustomerLoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "manager@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Incorrect email or password.");

    // Nothing may hint at the account's type or existence.
    expect(alert).not.toHaveTextContent(/customer account/i);
    expect(alert).not.toHaveTextContent(/staff|administrator/i);
    // ...including the contextual link that used to appear beside it.
    expect(
      screen.queryByRole("link", { name: /go to employee login/i }),
    ).toBeNull();
  });

  it("offers a standing employee link so staff are not stranded", async () => {
    // Shown to everyone regardless of input, so it reveals nothing about any
    // particular address — unlike the old error-conditional link.
    render(<CustomerLoginForm />);
    expect(
      screen.getByRole("link", { name: /i'm an employee/i }),
    ).toHaveAttribute("href", "/employee/login");
  });
});
