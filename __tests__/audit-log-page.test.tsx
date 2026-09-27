import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AuditLogEntry } from "@/lib/actions/audit";

const getAuditLog = vi.fn();
const getAuditActors = vi.fn();
vi.mock("@/lib/actions/audit", () => ({
  getAuditLog: (...args: unknown[]) => getAuditLog(...args),
  getAuditActors: (...args: unknown[]) => getAuditActors(...args),
}));

// The page reuses the reports' date input; its PDF actions are never called.
vi.mock("@/lib/actions/reports", () => ({
  generateSalesPDF: vi.fn(),
  generatePerformancePDF: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ManageAuditLogPage from "@/app/manage/audit-log/page";

function entry(over: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    audit_id: 1,
    occurred_at: "2026-09-27T06:05:00Z",
    actor_id: "0e7439bc-19c2-4f56-a6cb-6973cfe76c59",
    actor_name: "Ramon Tan",
    actor_role: "MANAGER",
    action: "product.price_change",
    entity_type: "product",
    entity_id: "9d66c247-c4f2-4b8f-8159-f694f17ae0b8",
    summary: 'Product "Yang\'s Fried Chicken": price ₱250.00 → ₱260.00',
    changes: { product_price: { from: 250, to: 260 } },
    source: "database",
    ...over,
  };
}

beforeEach(() => {
  getAuditLog.mockReset();
  getAuditActors.mockReset();
  getAuditActors.mockResolvedValue({
    data: [{ id: "0e7439bc-19c2-4f56-a6cb-6973cfe76c59", name: "Ramon Tan" }],
    error: null,
  });
});

describe("Audit log page", () => {
  it("lists who did what, newest first as the server sends it", async () => {
    getAuditLog.mockResolvedValue({
      data: {
        entries: [
          entry(),
          entry({
            audit_id: 2,
            actor_name: "Grace Lim",
            actor_role: "STAFF",
            action: "order.status_change",
            entity_type: "order",
            summary: "Order #5f131c4e: pending → preparing",
            changes: { order_status: { from: "pending", to: "preparing" } },
          }),
        ],
        totalCount: 2,
      },
      error: null,
    });

    render(<ManageAuditLogPage />);

    expect(await screen.findByText("Order #5f131c4e: pending → preparing")).toBeInTheDocument();
    expect(screen.getByText("Grace Lim")).toBeInTheDocument();
    expect(screen.getByText("Order status changed")).toBeInTheDocument();
    expect(screen.getByText("Price changed")).toBeInTheDocument();
    expect(getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, sort: "occurred_at", direction: "desc" }),
    );
  });

  it("asks the server for a category when one is picked", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [], totalCount: 0 }, error: null });
    render(<ManageAuditLogPage />);
    await waitFor(() => expect(getAuditLog).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /^action all actions$/i }));
    fireEvent.click(screen.getByRole("option", { name: "Menu" }));

    await waitFor(() =>
      expect(getAuditLog).toHaveBeenLastCalledWith(expect.objectContaining({ category: "menu", offset: 0 })),
    );
    expect(await screen.findByText("No actions match these filters.")).toBeInTheDocument();
  });

  it("sorts on the server when a column header is clicked", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [entry()], totalCount: 1 }, error: null });
    render(<ManageAuditLogPage />);
    await screen.findByText(/price ₱250\.00 → ₱260\.00/);

    // Employee: none → A–Z → Z–A → back to newest first.
    const employee = screen.getByRole("button", { name: "Employee" });
    fireEvent.click(employee);
    await waitFor(() =>
      expect(getAuditLog).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: "actor_name", direction: "asc", offset: 0 }),
      ),
    );
    fireEvent.click(employee);
    await waitFor(() =>
      expect(getAuditLog).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: "actor_name", direction: "desc" }),
      ),
    );
    fireEvent.click(employee);
    await waitFor(() =>
      expect(getAuditLog).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: "occurred_at", direction: "desc" }),
      ),
    );

    // "When" only flips between newest and oldest first.
    const when = screen.getByRole("button", { name: "When" });
    fireEvent.click(when);
    await waitFor(() =>
      expect(getAuditLog).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: "occurred_at", direction: "asc" }),
      ),
    );
  });

  it("jumps to the search box on /, like the customer menu", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [], totalCount: 0 }, error: null });
    render(<ManageAuditLogPage />);
    await screen.findByText("No employee actions recorded yet.");

    const search = screen.getByRole("searchbox", { name: "Search the audit log" });
    expect(search).toHaveAttribute("aria-keyshortcuts", "/");
    expect(document.activeElement).not.toBe(search);

    fireEvent.keyDown(document, { key: "/" });
    expect(document.activeElement).toBe(search);
  });

  it("labels every filter so the row lines up along one edge", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [], totalCount: 0 }, error: null });
    render(<ManageAuditLogPage />);
    await screen.findByText("No employee actions recorded yet.");

    for (const label of ["Action", "Employee", "Start Date", "End Date"]) {
      expect(screen.getByText(label, { selector: "span, label" })).toBeInTheDocument();
    }
  });

  it("says so when nothing has been recorded yet", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [], totalCount: 0 }, error: null });
    render(<ManageAuditLogPage />);
    expect(await screen.findByText("No employee actions recorded yet.")).toBeInTheDocument();
  });

  it("opens an entry with its before and after values, and offers no edit or delete", async () => {
    getAuditLog.mockResolvedValue({ data: { entries: [entry()], totalCount: 1 }, error: null });
    render(<ManageAuditLogPage />);

    fireEvent.click(await screen.findByText(/price ₱250\.00 → ₱260\.00/));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Recorded automatically by the database")).toBeInTheDocument();
    // Labels, not internal codes.
    expect(within(dialog).queryByText("product.price_change")).toBeNull();
    expect(within(dialog).getByText("Menu item")).toBeInTheDocument();
    expect(within(dialog).getByText("Price")).toBeInTheDocument();
    expect(within(dialog).getByText("250")).toBeInTheDocument();
    expect(within(dialog).getByText("260")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /delete|edit/i })).toBeNull();
  });

  it("shows the server's reason when the log can't be loaded, not an empty log", async () => {
    getAuditLog.mockResolvedValue({
      data: null,
      error: "You do not have permission to view the audit log.",
    });
    render(<ManageAuditLogPage />);
    expect(
      await screen.findByText(/Failed to load the audit log: You do not have permission/),
    ).toBeInTheDocument();
    expect(screen.getByText("The audit log couldn't be loaded.")).toBeInTheDocument();
    expect(screen.queryByText("No employee actions recorded yet.")).toBeNull();
  });
});
