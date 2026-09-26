import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useDropdown } from "@/lib/hooks/use-dropdown";

const OPTIONS = ["Manager", "Staff", "Delivery"];

function RolePicker({ onDialogCancel }: { onDialogCancel?: () => void }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("Staff");
  const menu = useDropdown({ open, onOpenChange: setOpen });

  return (
    <div onKeyDown={(e) => e.key === "Escape" && onDialogCancel?.()}>
      <span {...menu.labelProps}>Role</span>
      <button {...menu.triggerProps}>{role}</button>
      {open && (
        <div {...menu.listProps}>
          {OPTIONS.map((option) => (
            <button
              key={option}
              {...menu.optionProps(option === role)}
              onClick={() => {
                setRole(option);
                menu.close();
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <button type="button">Elsewhere</button>
    </div>
  );
}

function trigger() {
  return screen.getByRole("button", { name: /Role/ });
}

describe("useDropdown", () => {
  it("announces a collapsed listbox named by its label and value", () => {
    render(<RolePicker />);
    expect(trigger()).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAccessibleName("Role Staff");
  });

  it("opens onto the selected option and marks it", () => {
    render(<RolePicker />);
    fireEvent.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const staff = screen.getByRole("option", { name: "Staff" });
    expect(staff).toHaveAttribute("aria-selected", "true");
    expect(staff).toHaveFocus();
  });

  it("moves between options with the arrow, Home and End keys", () => {
    render(<RolePicker />);
    fireEvent.click(trigger());
    const list = screen.getByRole("listbox");

    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "Delivery" })).toHaveFocus();
    fireEvent.keyDown(list, { key: "Home" });
    expect(screen.getByRole("option", { name: "Manager" })).toHaveFocus();
    fireEvent.keyDown(list, { key: "End" });
    expect(screen.getByRole("option", { name: "Delivery" })).toHaveFocus();
    fireEvent.keyDown(list, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: "Staff" })).toHaveFocus();
  });

  it("closes on Escape, returns focus, and keeps Escape from the modal around it", () => {
    const onDialogCancel = vi.fn();
    render(<RolePicker onDialogCancel={onDialogCancel} />);
    fireEvent.click(trigger());

    fireEvent.keyDown(screen.getByRole("option", { name: "Staff" }), { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(onDialogCancel).not.toHaveBeenCalled();
  });

  it("closes on a press outside, but not on one inside", () => {
    render(<RolePicker />);
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByRole("option", { name: "Manager" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens from the keyboard and picks with a click", () => {
    render(<RolePicker />);
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: "Manager" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName("Role Manager");
    expect(trigger()).toHaveFocus();
  });
});
