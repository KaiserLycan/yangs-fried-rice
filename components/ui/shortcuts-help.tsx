"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SHORTCUTS,
  formatCombo,
  isMac,
  useShortcut,
} from "@/lib/hooks/use-shortcut";

const STAFF_AREAS = ["/manage", "/deliver", "/employee"];

/**
 * App-wide keyboard shortcuts, mounted once in the root layout:
 *   ?        this list
 *   Shift+C  cart         (customer pages only)
 *   Shift+O  your orders  (customer pages only)
 *
 * Screen-specific shortcuts (Ctrl+Enter to submit, / to search, Shift+N for a
 * new item) are registered by the screens that own those actions; this dialog
 * lists all of them so there is one place to learn them.
 */
export function ShortcutsHelp() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = React.useState(false);
  const [mac, setMac] = React.useState(false);
  React.useEffect(() => setMac(isMac()), []);

  const inCustomerArea = !STAFF_AREAS.some((area) => pathname.startsWith(area));

  useShortcut(SHORTCUTS.showHelp.combo, () => setOpen(true));
  useShortcut(SHORTCUTS.openCart.combo, () => router.push("/cart"), {
    enabled: inCustomerArea,
  });
  useShortcut(SHORTCUTS.openOrders.combo, () => router.push("/orders"), {
    enabled: inCustomerArea,
  });

  const rows = Object.values(SHORTCUTS).filter(
    (shortcut) =>
      inCustomerArea ||
      (shortcut !== SHORTCUTS.openCart && shortcut !== SHORTCUTS.openOrders),
  );

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="KEYBOARD SHORTCUTS"
      footer={
        <Button variant="outline" onClick={() => setOpen(false)}>
          Close
        </Button>
      }
    >
      <ul className="flex flex-col gap-[8px]">
        {rows.map((shortcut) => (
          <li
            key={shortcut.label}
            className="flex items-center justify-between gap-[16px] text-[13.5px] text-foreground"
          >
            <span>{shortcut.label}</span>
            <kbd className="rounded-[4px] border border-rule bg-background px-[7px] py-[2px] text-[12px] font-bold">
              {formatCombo(shortcut.combo, mac)}
            </kbd>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
