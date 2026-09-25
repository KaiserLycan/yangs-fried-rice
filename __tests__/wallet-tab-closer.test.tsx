import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { WalletTabCloser } from "@/components/checkout/wallet-tab-closer";

/**
 * Closing the wrong tab would be far worse than leaving a spare one open —
 * it would take the customer's own receipt away mid-payment. So every guard
 * gets its own case.
 */
function setup({
  opener,
}: {
  opener: { closed: boolean } | null | "cross-origin";
}) {
  const close = vi.fn();
  vi.stubGlobal("close", close);
  if (opener === "cross-origin") {
    // Reading `.closed` on a cross-origin opener throws.
    vi.stubGlobal("opener", {
      get closed(): boolean {
        throw new Error("cross-origin");
      },
    });
  } else {
    vi.stubGlobal("opener", opener);
  }
  return close;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WalletTabCloser", () => {
  it("closes the tab the payment happened in", () => {
    const close = setup({ opener: { closed: false } });
    render(<WalletTabCloser active />);
    expect(close).toHaveBeenCalled();
  });

  it("leaves the tab alone when the URL does not say it is disposable", () => {
    const close = setup({ opener: { closed: false } });
    render(<WalletTabCloser active={false} />);
    expect(close).not.toHaveBeenCalled();
  });

  it("leaves a tab the customer opened themselves alone", () => {
    // No opener: not script-opened, so this is the customer's own tab — and
    // the marker can only have come from a hand-crafted or shared URL.
    const close = setup({ opener: null });
    render(<WalletTabCloser active />);
    expect(close).not.toHaveBeenCalled();
  });

  it("leaves the tab alone when the opener is already gone", () => {
    // Nothing is watching for the payment any more, so this tab is the only
    // place the customer can see what happened.
    const close = setup({ opener: { closed: true } });
    render(<WalletTabCloser active />);
    expect(close).not.toHaveBeenCalled();
  });

  it("leaves the tab alone when the opener cannot be inspected", () => {
    const close = setup({ opener: "cross-origin" });
    render(<WalletTabCloser active />);
    expect(close).not.toHaveBeenCalled();
  });
});
