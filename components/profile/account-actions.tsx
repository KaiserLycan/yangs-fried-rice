"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { LogOutControl } from "@/components/auth/log-out-control";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

/**
 * The two account-level controls at the foot of the profile screen.
 *
 * Log out (Cust3) is a solid red button, and since issue #106 it is also in
 * the nav bar on every customer screen — so the control itself lives in
 * `LogOutControl` and this file only styles the trigger. Delete account
 * (Cust5) is wired to DELETE /api/profile (lib/actions/profile.ts) — same
 * pattern as logout: end the session, replace + refresh to /login so a
 * browser Back can't flash the signed-in page after the account is gone.
 *
 * Deleting takes one confirmation dialog, not a type-the-word step: the
 * dialog already states plainly that it is permanent, and a second hurdle on
 * top of it made a deliberate action feel like a puzzle.
 */
export function AccountActions() {
  const router = useRouter();
  const showToast = useToast();

  const [dialog, setDialog] = React.useState<"none" | "delete">("none");
  const [isDeleting, startDeleting] = React.useTransition();

  const closeDialog = () => {
    setDialog("none");
  };

  function handleDeleteAccount() {
    startDeleting(async () => {
      try {
        const res = await fetch("/api/profile", { method: "DELETE" });
        const json = await res.json();

        if (!res.ok) {
          closeDialog();
          showToast(json.error ?? "Could not delete your account.");
          return;
        }

        closeDialog();
        router.replace("/login");
        router.refresh();
      } catch {
        closeDialog();
        showToast("Could not delete your account. Check your connection.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-[12px] md:gap-[26px]">
        <LogOutControl className="w-full rounded-sm bg-error-border p-[10px] text-center text-[13.5px] font-bold text-white transition-colors hover:bg-error-border/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-border/40 disabled:cursor-not-allowed disabled:opacity-60 md:px-[18px] md:py-[15px]" />

        <button
          type="button"
          onClick={() => setDialog("delete")}
          className="w-full p-[10px] text-center text-[12px] font-bold text-muted-foreground underline hover:text-foreground"
        >
          Delete Account
        </button>
      </div>

      <Dialog
        open={dialog === "delete"}
        onClose={closeDialog}
        tone="danger"
        title="DELETE YOUR ACCOUNT?"
        description="This permanently deletes your profile and saved addresses. This can’t be undone."
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 p-[14px]"
              onClick={closeDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="confirm"
              className="flex-1"
              disabled={isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Deleting…" : "Delete Account"}
            </Button>
          </>
        }
      />
    </>
  );
}