import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhoneInput } from "@/components/ui/phone-input";
import { maskPhoneDigits } from "@/lib/validation/phone";

/**
 * The field is the first half of the rule — it makes a wrong number hard to
 * type in the first place. `lib/validation/phone.test.ts` covers the second
 * half, which is what actually refuses one.
 *
 * The box is masked: what someone types beside "+63" is grouped 3-3-4 as they
 * type, so "+63 962 693 9019" on screen matches how the number is displayed
 * everywhere else.
 */
describe("PhoneInput", () => {
  it("shows +63 as fixed text, not something to type", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    expect(screen.getByText("+63")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile number")).toHaveValue("");
  });

  it("accepts only digits, grouped as they are typed", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "917abc123!4567" } });
    expect(field).toHaveValue("917 123 4567");
  });

  it("matches the display format exactly: 9626939019 → 962 693 9019", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "9626939019" } });
    expect(field).toHaveValue("962 693 9019");
  });

  it("stops at ten digits", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "917123456799999" } });
    expect(field).toHaveValue("917 123 4567");
  });

  it("drops the country code or trunk 0 from a typed number", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "+63 917 123 4567" } });
    expect(field).toHaveValue("917 123 4567");

    fireEvent.change(field, { target: { value: "09171234567" } });
    expect(field).toHaveValue("917 123 4567");
  });

  it("takes a pasted +63 number whole, even though it is longer than the box", () => {
    const onValueChange = vi.fn();
    render(<PhoneInput aria-label="Mobile number" onValueChange={onValueChange} />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.paste(field, {
      clipboardData: { getData: () => "+63 962 693 9019" },
    });
    expect(field).toHaveValue("962 693 9019");
    expect(onValueChange).toHaveBeenLastCalledWith("9626939019");
  });

  it("reports the bare digits to a controlled parent", () => {
    const onValueChange = vi.fn();
    render(
      <PhoneInput aria-label="Mobile number" value="" onValueChange={onValueChange} />,
    );

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "0917-123-4567" },
    });
    expect(onValueChange).toHaveBeenCalledWith("9171234567");
  });

  it("shows a stored number without its +63, in display grouping", () => {
    render(<PhoneInput aria-label="Mobile number" defaultValue="+639171234567" />);
    expect(screen.getByLabelText("Mobile number")).toHaveValue("917 123 4567");
  });
});

describe("maskPhoneDigits", () => {
  it.each([
    ["", ""],
    ["9", "9"],
    ["962", "962"],
    ["9626", "962 6"],
    ["962693", "962 693"],
    ["9626939", "962 693 9"],
    ["9626939019", "962 693 9019"],
    ["+639626939019", "962 693 9019"],
  ])("%s → %s", (raw, masked) => {
    expect(maskPhoneDigits(raw)).toBe(masked);
  });
});
