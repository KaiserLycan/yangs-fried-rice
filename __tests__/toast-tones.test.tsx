import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast, type ToastTone } from "@/components/ui/toast";

/**
 * Issue #106: toasts were invisible — `bg-card` (#FFFCF6) sat on the app's
 * cream background (#FBF6EC) — and every message looked identical, so a
 * failure and a confirmation arrived in the same neutral box.
 */
function Raiser({ tone }: { tone?: ToastTone }) {
  const showToast = useToast();
  return (
    <button type="button" onClick={() => showToast("Something happened", tone)}>
      raise
    </button>
  );
}

function raise(tone?: ToastTone) {
  render(
    <ToastProvider>
      <Raiser tone={tone} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "raise" }));
  return screen.getByText("Something happened").closest("[data-tone]");
}

describe("toast tones", () => {
  it("defaults to info, so existing one-argument calls still work", () => {
    expect(raise()).toHaveAttribute("data-tone", "info");
  });

  it("no longer uses the near-invisible card surface for a neutral message", () => {
    const toast = raise();
    expect(toast?.className).not.toContain("bg-card");
    expect(toast?.className).toContain("bg-foreground");
  });

  it("borrows the alert's colours for a failure", () => {
    const toast = raise("error");
    expect(toast).toHaveAttribute("data-tone", "error");
    expect(toast?.className).toContain("bg-error-surface");
  });

  it("borrows the alert's colours for a success", () => {
    const toast = raise("success");
    expect(toast).toHaveAttribute("data-tone", "success");
    expect(toast?.className).toContain("bg-green-50");
  });

  it("carries a glyph that screen readers skip", () => {
    const toast = raise("error");
    const glyph = toast?.querySelector('[aria-hidden="true"]');
    expect(glyph).toHaveTextContent("!");
  });

  it("still announces the message through the live region", () => {
    raise("success");
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Something happened");
  });
});
