"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  DELETE_CONFIRMATION_WORD,
  isDeleteConfirmed,
} from "@/lib/profile/delete-confirmation";

/**
 * The two account-level controls at the foot of the profile screen.
 *
 * Log out (Cust3) was already wired. Delete account (Cust5) is now wired
 * too, to DELETE /api/profile (lib/actions/profile.ts) — same pattern as
 * logout: end the session, replace + refresh to /login so a browser Back
 * can't flash the signed-in page after the account is gone.
 */
export function AccountActions() {
  const router = useRouter();
  const showToast = useToast();

  const [dialog, setDialog] = React.useState<"none" | "logout" | "delete">(
    "none",
  );
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isSigningOut, startSigningOut] = React.useTransition();
  const [isDeleting, startDeleting] = React.useTransition();

  const closeDialog = () => {
    setDialog("none");
    setConfirmationText("");
  };

  function handleLogOut() {
    startSigningOut(async () => {
      const result = await logout();

      if (!result.success) {
        closeDialog();
        showToast(result.error);
        return;
      }

      closeDialog();
      router.replace("/login");
      router.refresh();
    });
  }

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
        <button
          type="button"
          onClick={() => setDialog("logout")}
          className="w-full rounded-sm border border-destructive/30 bg-destructive/10 p-[10px] text-center text-[13.5px] font-bold text-destructive underline transition-colors hover:bg-destructive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-60 md:px-[18px] md:py-[15px]"
        >
          Log out
        </button>

        <button
          type="button"
          onClick={() => setDialog("delete")}
          className="w-full p-[10px] text-center text-[9px] font-bold text-muted-foreground underline"
        >
          Delete Account
        </button>
      </div>

      <Dialog
        open={dialog === "logout"}
        onClose={closeDialog}
        title="LOG OUT?"
        description="You’ll need to sign in again to place an order."
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 p-[14px]"
              onClick={closeDialog}
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
              disabled={!isDeleteConfirmed(confirmationText) || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Deleting…" : "Delete Account"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[5px] rounded-md border border-primary bg-error-surface p-[12px]">
          <label
            htmlFor="delete-confirmation"
            className="text-[11px] font-bold uppercase text-primary"
          >
            Type {DELETE_CONFIRMATION_WORD} to confirm
          </label>
          <Input
            id="delete-confirmation"
            name="delete-confirmation"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={DELETE_CONFIRMATION_WORD}
            autoComplete="off"
            className="rounded-[11px] border-primary p-[12px] text-[14px]"
          />
        </div>
      </Dialog>
    </>
  );
}