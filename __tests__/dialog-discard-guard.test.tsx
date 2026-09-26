import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DialogDismiss, DialogRoot } from "@/components/ui/dialog";

function FormDialog({ dirty, onClose }: { dirty: boolean; onClose: () => void }) {
  return (
    <DialogRoot open onClose={onClose} dirty={dirty}>
      <input aria-label="Name" />
      <DialogDismiss fallback={onClose}>
        {(requestClose) => (
          <button type="button" onClick={requestClose}>
            Cancel
          </button>
        )}
      </DialogDismiss>
    </DialogRoot>
  );
}

function dialogElement() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

describe("DialogRoot unsaved-changes guard", () => {
  it("closes straight away when nothing has changed", () => {
    const onClose = vi.fn();
    render(<FormDialog dirty={false} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Discard changes?")).not.toBeInTheDocument();
  });

  it("asks before Cancel throws edits away, and Keep editing keeps them", () => {
    const onClose = vi.fn();
    render(<FormDialog dirty onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Discard changes?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByText("Discard changes?")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes once the manager chooses Discard", () => {
    const onClose = vi.fn();
    render(<FormDialog dirty onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("guards Escape and backdrop clicks too", () => {
    const onClose = vi.fn();
    render(<FormDialog dirty onClose={onClose} />);

    fireEvent(dialogElement(), new Event("cancel", { cancelable: true }));
    expect(screen.getByText("Discard changes?")).toBeInTheDocument();

    // A second Escape backs out of the prompt rather than closing the form.
    fireEvent(dialogElement(), new Event("cancel", { cancelable: true }));
    expect(screen.queryByText("Discard changes?")).not.toBeInTheDocument();

    fireEvent.click(dialogElement());
    expect(screen.getByText("Discard changes?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
