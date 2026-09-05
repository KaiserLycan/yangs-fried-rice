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
 * The two account-level controls at the foot of the profile screen, and the
 * dialogs that guard them.
 *
 * Log out (Cust3) is the one control on this screen that really works — a
 * shared sign-out action already exists, so this wires to it rather than
 * stubbing it. Delete account (Cust5) stops at its dialog: what deletion
 * actually does to the customer's rows is the database side's decision, so
 * the frontend confirms intent and says the rest is not built yet.
 */
export function AccountActions() {
  const router = useRouter();
  const showToast = useToast();

  const [dialog, setDialog] = React.useState<"none" | "logout" | "delete">(
    "none",
  );
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isSigningOut, startSigningOut] = React.useTransition();

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
      // refresh() clears the cached server-rendered payload for this route,
      // so the signed-in page cannot flash back on a browser Back after the
      // session has already gone.
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-[12px] md:gap-[26px]">
        <button
          type="button"
          onClick={() => setDialog("logout")}
          className="w-full p-[10px] text-center text-[13.5px] font-bold text-primary underline md:rounded-sm md:border md:border-rule md:bg-card md:px-[18px] md:py-[15px] md:text-foreground"
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
            >
              Cancel
            </Button>
            <Button
              variant="confirm"
              className="flex-1"
              // The gate: nothing but the exact word unlocks this.
              disabled={!isDeleteConfirmed(confirmationText)}
              onClick={() => {
                closeDialog();
                showToast(
                  "Deleting your account isn’t available yet. We’re still building it.",
                );
              }}
            >
              Delete Account
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
