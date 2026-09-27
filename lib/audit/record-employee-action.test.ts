import { afterEach, describe, expect, it, vi } from "vitest";
import { recordEmployeeAction } from "./record-employee-action";

function clientWith(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as never;
}

describe("recordEmployeeAction", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends the entry to record_employee_action, never an actor", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null });
    await recordEmployeeAction(clientWith(rpc), {
      action: "employee.create",
      entityType: "employee",
      entityId: "e-1",
      summary: 'Employee "Grace Lim" created as STAFF',
      changes: { role: { to: "STAFF" } },
    });

    expect(rpc).toHaveBeenCalledWith("record_employee_action", {
      p_action: "employee.create",
      p_entity_type: "employee",
      p_entity_id: "e-1",
      p_summary: 'Employee "Grace Lim" created as STAFF',
      p_changes: { role: { to: "STAFF" } },
    });
    // The database takes the actor from the session; the app cannot name one.
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toMatch(/actor/);
  });

  it("does not fail the action when the log refuses the entry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      recordEmployeeAction(clientWith(rpc), {
        action: "session.sign_out",
        entityType: "session",
        summary: "Signed out",
      }),
    ).resolves.toBeUndefined();
  });

  it("does not fail the action when the call itself throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(
      recordEmployeeAction(clientWith(rpc), {
        action: "report.export",
        entityType: "report",
        summary: "Exported",
      }),
    ).resolves.toBeUndefined();
  });
});
