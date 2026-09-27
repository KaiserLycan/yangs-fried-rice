import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fallbackStoreStatus, type StoreStatus } from "@/lib/store/store-status";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const updateStoreSettings = vi.fn();
vi.mock("@/lib/actions/store-setting", () => ({
  pauseStore: vi.fn(),
  resumeStore: vi.fn(),
  updateStoreSettings: (input: unknown) => updateStoreSettings(input),
}));

import { StoreControlPanel } from "@/components/manage/dashboard/store-control-panel";

const counts = { queue: 3, prep: 2, pickup: 1, completedToday: 12, cancelledToday: 4 };

function status(over: Partial<StoreStatus> = {}): StoreStatus {
  return {
    ...fallbackStoreStatus(),
    isOpen: true,
    openTime: "06:30",
    closeTime: "19:31",
    maxActiveOrders: 20,
    ...over,
  };
}

const save = () => screen.getByRole("button", { name: "Save settings" });
const edit = () => screen.getByRole("button", { name: "Edit" });
const opensAt = () => screen.getByLabelText("Opens at") as HTMLInputElement;
const closesAt = () => screen.getByLabelText("Closes at") as HTMLInputElement;

beforeEach(() => {
  refresh.mockClear();
  updateStoreSettings.mockReset();
});

describe("StoreControlPanel (issue #115 follow-up)", () => {
  it("shows the hours to the minute", () => {
    render(<StoreControlPanel status={status()} counts={counts} />);

    expect(screen.getByText(/Hours 6:30 AM – 7:31 PM/)).toBeInTheDocument();
    expect(opensAt().value).toBe("06:30");
    expect(closesAt().value).toBe("19:31");
  });

  it("shows orders per stage, and queue + prep against the busy limit", () => {
    render(<StoreControlPanel status={status()} counts={counts} />);

    for (const [label, value] of [
      ["Queue", "3"],
      ["Prep", "2"],
      ["For pickup", "1"],
      ["Completed today", "12"],
      ["Cancelled today", "4"],
    ]) {
      expect(screen.getByText(label).nextElementSibling).toHaveTextContent(value);
    }
    expect(screen.getByText("5 / 20")).toBeInTheDocument();
  });

  it("is read-only with Save disabled until Edit is pressed", () => {
    render(<StoreControlPanel status={status()} counts={counts} />);

    expect(opensAt()).toBeDisabled();
    expect(save()).toBeDisabled();
    expect(edit()).toBeEnabled();

    fireEvent.click(edit());

    expect(opensAt()).toBeEnabled();
    expect(save()).toBeEnabled();
    expect(edit()).toBeDisabled();
  });

  it("flags a close time before the open time at once, and blocks Save", () => {
    render(<StoreControlPanel status={status()} counts={counts} />);
    fireEvent.click(edit());

    fireEvent.change(closesAt(), { target: { value: "05:00" } });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Closing time must be later than opening time.",
    );
    expect(save()).toBeDisabled();
    expect(closesAt()).toHaveAttribute("min", "06:30");

    fireEvent.change(closesAt(), { target: { value: "20:15" } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(save()).toBeEnabled();
  });

  it("saves the edited times and returns to read-only", async () => {
    updateStoreSettings.mockResolvedValue({ data: true, error: null });
    render(<StoreControlPanel status={status()} counts={counts} />);
    fireEvent.click(edit());

    fireEvent.change(opensAt(), { target: { value: "07:15" } });
    fireEvent.click(save());

    await waitFor(() =>
      expect(updateStoreSettings).toHaveBeenCalledWith(
        expect.objectContaining({ open_time: "07:15", close_time: "19:31" }),
      ),
    );
    await waitFor(() => expect(save()).toBeDisabled());
    expect(edit()).toBeEnabled();
  });

  it("Cancel throws the changes away", () => {
    render(<StoreControlPanel status={status()} counts={counts} />);
    fireEvent.click(edit());
    fireEvent.change(opensAt(), { target: { value: "09:00" } });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(opensAt().value).toBe("06:30");
    expect(save()).toBeDisabled();
  });

  it("shows an end-of-day close as 23:59 in the picker", () => {
    render(<StoreControlPanel status={status({ closeTime: "24:00" })} counts={counts} />);
    expect(closesAt().value).toBe("23:59");
  });
});
