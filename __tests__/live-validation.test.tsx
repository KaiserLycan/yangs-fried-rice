import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerLoginForm } from "@/components/auth/customer-login-form";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { useRouter, useSearchParams } from "next/navigation";
import { loginCustomer, registerCustomer } from "@/app/(auth)/actions";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/app/(auth)/actions", () => ({
  loginCustomer: vi.fn(),
  registerCustomer: vi.fn(),
}));

// The delivery-area check calls the geocoder; report every address as fine.
vi.mock("@/components/checkout/address-validation-note", () => ({
  AddressValidationNote: ({ onStatusChange }: { onStatusChange?: (s: string) => void }) => {
    onStatusChange?.("valid");
    return null;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as any).mockReturnValue({ push: vi.fn(), refresh: vi.fn() });
  (useSearchParams as any).mockReturnValue({ get: vi.fn(() => null) });
});

describe("real-time validation", () => {
  it("shows an error under the field while typing, before any submit", () => {
    render(<CustomerLoginForm />);
    const email = screen.getByLabelText(/email/i);

    fireEvent.change(email, { target: { value: "liza@" } });

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an error when a field is left, even if it was never typed in", () => {
    render(<CustomerLoginForm />);
    const password = screen.getByLabelText(/^password/i);

    fireEvent.focus(password);
    fireEvent.blur(password);

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("clears the error as soon as the value becomes valid", () => {
    render(<CustomerLoginForm />);
    const email = screen.getByLabelText(/email/i);

    fireEvent.change(email, { target: { value: "liza@" } });
    fireEvent.change(email, { target: { value: "liza@example.com" } });

    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("keeps Log in disabled until every rule passes, not just until fields are non-empty", () => {
    render(<CustomerLoginForm />);
    const button = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "liza@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "short" } });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "long-enough-password" } });
    expect(button).toBeEnabled();
  });
});

describe("sign-up", () => {
  function fillValidSignup() {
    const set = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    set(/first name/i, "Liza");
    set(/last name/i, "Reyes");
    set(/^email/i, "liza@example.com");
    set(/mobile number/i, "9171234567");
    set(/^password/i, "long-enough-password");
    set(/building \/ house no/i, "21");
    set(/^street/i, "Mabini St.");
    set(/^barangay/i, "Malate");
    set(/^city/i, "Manila");
    set(/zip code/i, "1004");
    fireEvent.click(screen.getByRole("checkbox"));
  }

  it("has separate first name, last name and five address inputs", () => {
    render(<CustomerSignupForm />);
    for (const label of [/first name/i, /last name/i, /building \/ house no/i, /^street/i, /^barangay/i, /^city/i, /zip code/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("enforces length limits on the inputs themselves", () => {
    render(<CustomerSignupForm />);
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("maxLength", "50");
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("minLength", "2");
    expect(screen.getByLabelText(/zip code/i)).toHaveAttribute("maxLength", "4");
  });

  it("masks the mobile number as it is typed", () => {
    render(<CustomerSignupForm />);
    const phone = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phone, { target: { value: "9626939019" } });
    expect(phone).toHaveValue("962 693 9019");
  });

  it("stays disabled until the Terms box is ticked", () => {
    render(<CustomerSignupForm />);
    fillValidSignup();
    const button = screen.getByRole("button", { name: /create account/i });
    expect(button).toBeEnabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(button).toBeDisabled();
  });

  it("puts a server rejection under the field it names and in the summary", async () => {
    (registerCustomer as any).mockResolvedValue({
      success: false,
      error: "Some fields need fixing before we can create your account.",
      fieldErrors: { email: "An account with this email already exists." },
    });

    render(<CustomerSignupForm />);
    fillValidSignup();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/An account with this email already exists/)).toHaveLength(2);
    });
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute("aria-invalid", "true");
    // The summary links to the field.
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", "#signup-email");
    // Editing the field clears the server's complaint.
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "liza.reyes@example.com" } });
    expect(screen.getAllByText(/An account with this email already exists/)).toHaveLength(1);
  });

  it("sends the atomic fields to the server, with the phone in +63 form", async () => {
    (registerCustomer as any).mockResolvedValue({ success: true, signedIn: true });

    render(<CustomerSignupForm />);
    fillValidSignup();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(registerCustomer).toHaveBeenCalled());
    expect(registerCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Liza",
        lastName: "Reyes",
        phone: "+639171234567",
        buildingNo: "21",
        street: "Mabini St.",
        barangay: "Malate",
        city: "Manila",
        zip: "1004",
      }),
    );
    expect(loginCustomer).not.toHaveBeenCalled();
  });
});
