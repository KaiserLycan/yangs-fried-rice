import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { WalletTabCloser } from "@/components/checkout/wallet-tab-closer";
import { answerAsWatcher } from "@/lib/checkout/wallet-tab";

const ORDER = "order-79";

/**
 * Closing the wrong tab would be far worse than leaving a spare one open —
 * it would take the customer's own receipt away while they are mid-payment.
 * So every route to a close, and every route to staying put, gets a case.
 */
function stubWindow({ opener }: { opener: { closed: boolean } | null }) {
  const close = vi.fn();
  vi.stubGlobal("close", close);
  vi.stubGlobal("opener", opener);
  return close;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WalletTabCloser", () => {
  it("closes at once when the opener survived", () => {
    const close = stubWindow({ opener: { closed: false } });
    render(<WalletTabCloser active orderId={ORDER} />);
    expect(close).toHaveBeenCalled();
  });

  /**
   * The case that matters in practice. A payment provider sending
   * `Cross-Origin-Opener-Policy: same-origin` severs the opener for good,
   * so the tab comes home unable to prove it was opened by us — and the
   * first version of this component then refused to close, which is exactly
   * what was reported.
   */
  it("closes when the opener is gone but another tab answers", async () => {
    const close = stubWindow({ opener: null });
    const stopWatching = answerAsWatcher(ORDER);

    render(<WalletTabCloser active orderId={ORDER} />);

    await waitFor(() => expect(close).toHaveBeenCalled());
    stopWatching();
  });

  it("stays put when nobody is watching", async () => {
    // The popup-blocked fallback: one tab, which is the customer's own.
    const close = stubWindow({ opener: null });
    render(<WalletTabCloser active orderId={ORDER} />);

    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(close).not.toHaveBeenCalled();
  });

  it("stays put when the tab watching is a different order", async () => {
    const close = stubWindow({ opener: null });
    const stopWatching = answerAsWatcher("some-other-order");

    render(<WalletTabCloser active orderId={ORDER} />);

    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(close).not.toHaveBeenCalled();
    stopWatching();
  });

  it("stays put, and answers, when this is the customer's own receipt", async () => {
    const close = stubWindow({ opener: { closed: false } });
    render(<WalletTabCloser active={false} orderId={ORDER} />);

    expect(close).not.toHaveBeenCalled();

    // It is now the watcher another tab can find.
    const { anotherTabIsWatching } = await import("@/lib/checkout/wallet-tab");
    await expect(anotherTabIsWatching(ORDER)).resolves.toBe(true);
  });

  it("stops answering once it is gone", async () => {
    stubWindow({ opener: null });
    const { unmount } = render(
      <WalletTabCloser active={false} orderId={ORDER} />,
    );
    unmount();

    const { anotherTabIsWatching } = await import("@/lib/checkout/wallet-tab");
    await expect(anotherTabIsWatching(ORDER)).resolves.toBe(false);
  });
});
