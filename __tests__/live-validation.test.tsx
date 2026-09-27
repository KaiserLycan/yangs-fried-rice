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

  // "As soon as" now means "once typing pauses": re-parsing the whole schema
  // per keystroke was the complaint in issue #106. Appearing is still
  // immediate — only clearing waits for the pause.
  it("clears the error once the value becomes valid", async () => {
    render(<CustomerLoginForm />);
    const email = screen.getByLabelText(/email/i);

    fireEvent.change(email, { target: { value: "liza@" } });
    fireEvent.change(email, { target: { value: "liza@example.com" } });

    await waitFor(() =>
      expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument(),
    );
  });

  it("keeps Log in disabled until every rule passes, not just until fields are non-empty", async () => {
    render(<CustomerLoginForm />);
    const button = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "liza@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "short" } });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Long-enough-Passw0rd" } });
    await waitFor(() => expect(button).toBeEnabled());
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
    set(/^password/i, "Long-enough-Passw0rd");
    fireEvent.click(screen.getByRole("checkbox", { name: /i am at least 18/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /terms & policy/i }));
  }

  it("has separate first and last name inputs, and no address or birthday", () => {
    render(<CustomerSignupForm />);
    for (const label of [/first name/i, /last name/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    // Pickup-only, no delivery service, no birthday promotion.
    for (const label of [/building \/ house no/i, /^street/i, /^barangay/i, /^city/i, /zip code/i, /date of birth/i]) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
    }
  });

  it("enforces length limits on the inputs themselves", () => {
    render(<CustomerSignupForm />);
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("maxLength", "50");
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("minLength", "2");
  });

  it("masks the mobile number as it is typed", () => {
    render(<CustomerSignupForm />);
    const phone = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phone, { target: { value: "9626939019" } });
    expect(phone).toHaveValue("962 693 9019");
  });

  it("stays disabled until the Terms box is ticked", async () => {
    render(<CustomerSignupForm />);
    fillValidSignup();
    const button = screen.getByRole("button", { name: /create account/i });
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(screen.getByRole("checkbox", { name: /terms & policy/i }));
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("stays disabled until the age box is ticked (F16)", async () => {
    render(<CustomerSignupForm />);
    fillValidSignup();
    const button = screen.getByRole("button", { name: /create account/i });
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(screen.getByRole("checkbox", { name: /i am at least 18/i }));
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("puts a server rejection under the field it names and in the summary", async () => {
    (registerCustomer as any).mockResolvedValue({
      success: false,
      error: "Some fields need fixing before we can create your account.",
      fieldErrors: { email: "An account with this email already exists." },
    });

    render(<CustomerSignupForm />);
    fillValidSignup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled(),
    );
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
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(registerCustomer).toHaveBeenCalled());
    expect(registerCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Liza",
        lastName: "Reyes",
        phone: "+639171234567",
      }),
    );
    expect(loginCustomer).not.toHaveBeenCalled();
  });
});
