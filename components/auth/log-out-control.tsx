"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

/**
 * Sign out, with its confirmation.
 *
 * Extracted from `AccountActions` so it can appear in more than one place.
 * Issue #106: "similar to the manage and deliver, there should be an instant
 * access button" — both of those carry logout in their chrome, while a
 * customer had to open their profile and scroll to the bottom of it to find
 * the same control.
 *
 * The confirmation comes along with it. Manage and deliver sign out on a
 * single click, but this control is now one click from the nav bar on every
 * customer screen, where an accidental hit costs the person their cart
 * context and a fresh login.
 *
 * `children` and `className` style the trigger, so the profile screen keeps
 * its full-width red button and the nav bar gets something that fits a
 * 58px-tall red bar, without either one owning a second copy of the
 * sign-out logic. Any other button attribute passes straight through —
 * `aria-label` for the icon-only nav version, and the `aria-describedby`
 * that `Tooltip` clones onto whatever it wraps, which would otherwise be
 * swallowed here and never reach the real button.
 */
export function LogOutControl({
  className,
  children = "Log out",
  redirectTo = "/login",
  ...buttonProps
}: Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "type"> & {
  /** Where to land afterwards. Customers go to their own login page. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSigningOut, startSigningOut] = React.useTransition();

  function handleLogOut() {
    startSigningOut(async () => {
      const result = await logout();

      if (!result.success) {
        setOpen(false);
        showToast(result.error, "error");
        return;
      }

      setOpen(false);
      // `replace`, not `push`: a browser Back must not flash the signed-in
      // page after the session has ended.
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <>
      <button
        {...buttonProps}
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="LOG OUT?"
        description="You’ll need to sign in again to place an order."
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 p-[14px]"
              onClick={() => setOpen(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="confirm"
              className="flex-1"
              onClick={handleLogOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Logging out…" : "Log Out"}
            </Button>
          </>
        }
      />
    </>
  );
}
