import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { CardValue } from "@/components/profile/profile-card";
import { OrderCard } from "@/components/manage/orders/order-card";
import { PastOrderCard } from "@/components/orders/past-order-card";
import { ToastProvider } from "@/components/ui/toast";
import { reviewSubmissionSchema } from "@/lib/validation/reviews";
import { addCartItemSchema } from "@/lib/validation/cart";
import type { OrderData } from "@/lib/mock-orders";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/orders",
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * XSS — Phase 4 section E.
 *
 * The claim being tested is that user input is treated as data, not code.
 * React escapes anything interpolated into JSX, so the risk is not "did we
 * remember to escape this string" but "did we anywhere step outside that
 * guarantee" — `dangerouslySetInnerHTML`, a `javascript:` URL, an unescaped
 * attribute. These tests render real components with real payloads, then scan
 * the source for the escape hatches.
 */

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror="alert(1)">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  "<svg/onload=alert(1)>",
  "javascript:alert(1)",
  "<iframe src='javascript:alert(1)'></iframe>",
  "<body onload=alert(1)>",
  "{{constructor.constructor('alert(1)')()}}",
];

function assertNothingExecutable(container: HTMLElement) {
  // If the payload had been treated as markup, these would exist.
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("iframe")).toBeNull();
  expect(container.querySelector("svg[onload]")).toBeNull();
  expect(container.querySelector("img[onerror]")).toBeNull();
  expect(container.querySelector("[onerror]")).toBeNull();
  expect(container.querySelector("[onload]")).toBeNull();
}

describe("E1. a stored profile value renders as text", () => {
  it.each(XSS_PAYLOADS)("renders %s harmlessly", (payload) => {
    const { container } = render(<CardValue value={payload} />);

    assertNothingExecutable(container);
    // Present, and present as text — the exact characters the user typed.
    expect(container.textContent).toContain(payload);
  });
});

describe("E2. a customer's own text on the staff order screen", () => {
  function orderWith(payload: string): OrderData {
    return {
      id: "11111111-1111-4111-8111-111111111111",
      orderNumber: "36F1",
      time: "09:00 AM",
      status: "QUEUE",
      isDelivery: false,
      timer: "20:00",
      contactInfo: { name: payload, address: payload, phone: payload },
      orderInfo: { type: "Take Out", specialInstructions: payload },
      deliveryFee: 0,
      total: 100,
      items: [{ quantity: 1, name: payload, price: 100, addons: payload }],
    };
  }

  it.each(XSS_PAYLOADS)("renders %s in the order card harmlessly", (payload) => {
    const { container } = render(<OrderCard order={orderWith(payload)} />);

    assertNothingExecutable(container);
    expect(container.textContent).toContain(payload);
  });
});

describe("E3. a product name in the customer's order history", () => {
  it.each(XSS_PAYLOADS)("renders %s harmlessly", (payload) => {
    const { container } = render(
      <ToastProvider>
        <PastOrderCard
          order={{
            orderId: "11111111-1111-4111-8111-111111111111",
            orderNumber: "1042",
            placedAt: "2026-08-24T11:12:00Z",
            orderStatus: "completed",
            cancelledAt: null,
            deliveryStatus: "delivered",
            orderType: "delivery",
            items: [{ name: payload, quantity: 1, productId: "p1" }],
            total: 100,
            rating: null,
            productRatings: {},
          }}
        />
      </ToastProvider>,
    );

    assertNothingExecutable(container);
    expect(screen.getByText(new RegExp(payload.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeTruthy();
  });
});

describe("E4. validation keeps the payload intact rather than half-stripping it", () => {
  // Silently rewriting input is its own bug: it corrupts legitimate text and
  // gives false confidence. The defence is escaping at render, so the stored
  // value should come back byte for byte.
  it.each(XSS_PAYLOADS)("stores %s unchanged", (payload) => {
    const review = reviewSubmissionSchema.safeParse({ rating: 5, comment: payload });
    expect(review.success).toBe(true);
    if (review.success) expect(review.data.comment).toBe(payload);

    const item = addCartItemSchema.safeParse({
      product_id: "11111111-1111-4111-8111-111111111111",
      quantity: 1,
      special_instructions: payload,
    });
    expect(item.success).toBe(true);
    if (item.success) expect(item.data.special_instructions).toBe(payload);
  });
});

/**
 * E5. Nothing steps outside React's escaping.
 */
describe("E5. no unsafe rendering escape hatch exists", () => {
  const ROOTS = ["app", "lib", "components"];
  const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

  function sourceFiles(path: string): string[] {
    if (statSync(path).isFile()) return /\.(ts|tsx)$/.test(path) ? [path] : [];
    return readdirSync(path).flatMap((entry) =>
      SKIP_DIRS.has(entry) ? [] : sourceFiles(join(path, entry)),
    );
  }

  const files = ROOTS.flatMap(sourceFiles).filter((f) => !/\.test\.(ts|tsx)$/.test(f));

  it("never uses dangerouslySetInnerHTML", () => {
    const offenders = files.filter((f) => /dangerouslySetInnerHTML/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("never writes innerHTML or outerHTML directly", () => {
    const offenders = files.filter((f) =>
      /\.(inner|outer)HTML\s*=/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("never evaluates a string as code", () => {
    const offenders = files.filter((f) => {
      const source = readFileSync(f, "utf8");
      return /\beval\s*\(/.test(source) || /new\s+Function\s*\(/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  /**
   * A `href` holding a value that came from the database or a form could be
   * `javascript:alert(1)`. Every dynamic href in this app resolves to a
   * hard-coded route constant instead; they are listed so that a new one has
   * to be looked at rather than slipping in unnoticed.
   */
  it("only ever binds href to a hard-coded route", () => {
    const ALLOWED = new Map<string, string>([
      ["components/auth/auth-tabs.tsx", "href={href} — the Tab prop, given /login or /register literally"],
      ["components/manage/sidebar.tsx", "href={item.href} — from the NAV_ITEMS constant"],
      ["components/nav/site-nav-bar.tsx", "href={href} — from the NAV_LINKS constant"],
      ["components/nav/bottom-tab-bar.tsx", "href={href} — from the TABS constant"],
    ]);

    const offenders: string[] = [];
    for (const file of files) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.match(/\bhref=\{([^}]*)\}/g) ?? []) {
        const value = match.slice(match.indexOf("{") + 1, -1).trim();

        // A literal, or a template/ternary whose URL starts with a fixed
        // path or fragment — the scheme cannot be changed by the value.
        const fixedStart = /^[`"']\s*[/#]/.test(value) || /["'`]\s*[/#]/.test(value);
        if (fixedStart) continue;
        // `join` builds backslash paths on Windows; the list uses forward slashes.
        if (ALLOWED.has(file.replace(/\\/g, "/"))) continue;

        offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Image sources are exempt from the rule above: a `javascript:` URL in an
   * <img src> is not executed by any current browser. They are still checked
   * to be image values (uploads and previews), not arbitrary user text.
   */
  it("only binds src to an image URL or preview", () => {
    const IMAGE_LIKE = /(image|imageUrl|preview|avatar|proof|photo|icon|logo|src)/i;
    const offenders: string[] = [];

    for (const file of files) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.match(/\bsrc=\{([^}]*)\}/g) ?? []) {
        const value = match.slice(match.indexOf("{") + 1, -1).trim();
        if (/^[`"']/.test(value)) continue;
        if (IMAGE_LIKE.test(value)) continue;
        offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
