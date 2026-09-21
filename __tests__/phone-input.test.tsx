import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhoneInput } from "@/components/ui/phone-input";

/**
 * The field is the first half of the rule — it makes a wrong number hard to
 * type in the first place. `lib/validation/phone.test.ts` covers the second
 * half, which is what actually refuses one.
 */
describe("PhoneInput", () => {
  it("shows +63 as fixed text, not something to type", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    expect(screen.getByText("+63")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile number")).toHaveValue("");
  });

  it("accepts only digits", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "917abc123!4567" } });
    expect(field).toHaveValue("9171234567");
  });

  it("stops at ten digits", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "917123456799999" } });
    expect(field).toHaveValue("9171234567");
  });

  it("drops the country code or trunk 0 from a pasted number", () => {
    render(<PhoneInput aria-label="Mobile number" />);
    const field = screen.getByLabelText("Mobile number");

    fireEvent.change(field, { target: { value: "+63 917 123 4567" } });
    expect(field).toHaveValue("9171234567");

    fireEvent.change(field, { target: { value: "09171234567" } });
    expect(field).toHaveValue("9171234567");
  });

  it("reports the digits to a controlled parent", () => {
    const onValueChange = vi.fn();
    render(
      <PhoneInput aria-label="Mobile number" value="" onValueChange={onValueChange} />,
    );

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "0917-123-4567" },
    });
    expect(onValueChange).toHaveBeenCalledWith("9171234567");
  });

  it("shows a stored number without its +63", () => {
    render(<PhoneInput aria-label="Mobile number" defaultValue="+639171234567" />);
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9171234567");
  });
});
