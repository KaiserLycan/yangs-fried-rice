import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { z } from "zod";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/app/(auth)/actions", () => ({
  registerCustomer: vi.fn(),
  loginCustomer: vi.fn(),
}));

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

/**
 * Issue #106 — "things to remove/revise in the signup form to make it look
 * cleaner". Each of these was a real duplicate or a rule hidden somewhere a
 * person had to go looking for it.
 */
describe("sign-up form copy", () => {
  it("gives the phone example once, not twice", () => {
    render(<CustomerSignupForm />);
    const phone = screen.getByLabelText(/mobile number/i);

    // It lives on the input, where someone about to type sees it.
    expect(phone).toHaveAttribute("placeholder", "917 123 4567");
    // And no longer a second time as helper text underneath.
    expect(screen.queryByText(/e\.g\. \+63 917 123 4567/)).toBeNull();
  });

  it("puts the date-of-birth rule on the label rather than under the field", () => {
    render(<CustomerSignupForm />);

    expect(screen.getByLabelText(/date of birth \(optional, 13\+\)/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Must be a past date — you need to be 13 or older/),
    ).toBeNull();
  });

  /**
   * The sentence used to be inside a `hidden md:flex` block, so the people
   * most likely to need it — everyone on a phone — never saw it.
   */
  it("shows the instructions at phone width, not only on desktop", () => {
    render(<CustomerSignupForm />);
    const intro = screen.getByText(/Fill in your details and the address we deliver to/);

    expect(intro).toBeInTheDocument();
    expect(intro.className).not.toMatch(/\bhidden\b/);
    expect(intro.closest("div")?.className).not.toMatch(/\bhidden\b/);
  });
});

/**
 * The form used to rebuild its FormData and re-parse the entire schema on
 * every single keypress — eleven fields plus an address, per character.
 */
describe("live validation is debounced", () => {
  function Harness({ schema }: { schema: z.ZodType<{ name: string }> }) {
    const live = useLiveValidation({
      schema,
      read: (data) => ({ name: String(data.get("name") ?? "") }),
    });
    return (
      <form {...live.formProps}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
        <p>{live.errors.name ?? "no error"}</p>
      </form>
    );
  }

  it("checks once after a burst of keystrokes, not once per keystroke", async () => {
    const schema = z.object({ name: z.string().min(3, "Too short.") });
    const parse = vi.spyOn(schema, "safeParse");

    render(<Harness schema={schema} />);
    const input = screen.getByLabelText("Name");

    // The hook checks on mount and again after 500ms, to catch autofill.
    // Wait that out so what follows counts only the typing.
    await new Promise((resolve) => setTimeout(resolve, 700));
    parse.mockClear();

    for (const value of ["L", "Li", "Liz", "Liza", "Liza "]) {
      fireEvent.change(input, { target: { value } });
    }

    // Nothing yet — the burst is still in flight.
    expect(parse).not.toHaveBeenCalled();

    await waitFor(() => expect(parse).toHaveBeenCalledTimes(1));
  });

  it("still checks immediately when a field is left", async () => {
    const schema = z.object({ name: z.string().min(3, "Too short.") });
    render(<Harness schema={schema} />);
    const input = screen.getByLabelText("Name");

    await new Promise((resolve) => setTimeout(resolve, 700));

    fireEvent.change(input, { target: { value: "Li" } });
    fireEvent.blur(input);

    // Leaving a field is a deliberate act with a pause built in, so there is
    // nothing to debounce away.
    expect(screen.getByText("Too short.")).toBeInTheDocument();
  });
});
