import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast, type ToastTone } from "@/components/ui/toast";

function Trigger({ tone }: { tone?: ToastTone }) {
  const showToast = useToast();
  return (
    <button type="button" onClick={() => showToast("Saved.", tone)}>
      Go
    </button>
  );
}

function raise(tone?: ToastTone) {
  render(
    <ToastProvider>
      <Trigger tone={tone} />
    </ToastProvider>,
  );
  act(() => {
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
  });
  return screen.getByText("Saved.").closest("[data-tone]") as HTMLElement;
}

describe("toast tones", () => {
  it("defaults to info, so callers written before tones still work", () => {
    const toast = raise();
    expect(toast.dataset.tone).toBe("info");
    // A solid surface, not the old near-invisible `bg-card` on cream.
    expect(toast.className).toContain("bg-foreground");
    expect(toast.className).not.toContain("bg-card");
  });

  it("colours success and error and gives each its own glyph", () => {
    const success = raise("success");
    expect(success.dataset.tone).toBe("success");
    expect(success.className).toContain("bg-success");
    expect(success.textContent).toContain("✓");
  });

  it("marks errors with the error fill and a !", () => {
    const error = raise("error");
    expect(error.className).toContain("bg-error-border");
    expect(error.textContent).toContain("!");
  });
});
