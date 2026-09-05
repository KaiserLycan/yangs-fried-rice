"use client";

import * as React from "react";
import { CardField, CardInput, ProfileCard } from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ShowHideToggle } from "@/components/ui/show-hide-toggle";
import { useToast } from "@/components/ui/toast";
import { passwordStrength } from "@/lib/profile/password-strength";
import {
  passwordChangeSchema,
  type PasswordChangeField,
} from "@/lib/validation/profile";

const SAVE_TOAST =
  "Updating your password isn’t available yet. We’re still building it.";

/**
 * No `password_changed_at` column exists yet — see
 * `.scratch/profile-page/issues/05-backend-handoff.md`. Confirmed as coming,
 * most likely maintained by a database trigger, so this reads as a visible
 * empty state rather than the frame's invented "4 months ago".
 */
const LAST_CHANGED_EMPTY_STATE = "Not tracked yet.";

/** Both breakpoints parse the same three fields out of their own form. */
function readPasswordForm(form: FormData) {
  return {
    currentPassword: String(form.get("currentPassword") ?? ""),
    newPassword: String(form.get("newPassword") ?? ""),
    confirmPassword: String(form.get("confirmPassword") ?? ""),
  };
}

/**
 * Change password (Cust4).
 *
 * Two compositions, not one reflowed — the same call `ProfileHeader` makes.
 * Desktop toggles this card open the way Personal and Contact details do,
 * because the frame lays its three fields out inline inside the card.
 * Mobile has no frame for the form at all — only a "Change" button, with
 * nowhere in the collapsed row for fields to go — so its button opens the
 * `Dialog` primitive instead of toggling the card, holding the same three
 * fields ticket 03's address form uses the same primitive for.
 *
 * Desktop and mobile each get their **own** `useCardEditor` call, even
 * though both validate the same schema and raise the same toast. A single
 * shared `isEditing` looked appealing, but both trees are mounted at once —
 * one hidden by CSS, not unmounted — so one boolean would mean desktop's
 * Edit button also opens the mobile dialog's native `<dialog>` on top of the
 * inline form it just revealed. Two independent booleans is what keeps each
 * breakpoint's control wired only to its own presentation.
 *
 * Submitting raises a toast and changes nothing. See
 * `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export function PasswordCard() {
  const showToast = useToast();

  const desktop = useCardEditor({
    schema: passwordChangeSchema,
    read: readPasswordForm,
    onValid: () => showToast(SAVE_TOAST),
  });
  const mobile = useCardEditor({
    schema: passwordChangeSchema,
    read: readPasswordForm,
    onValid: () => showToast(SAVE_TOAST),
  });

  return (
    <div id="password">
      {/* Desktop */}
      <div className="hidden md:block">
        <ProfileCard
          title="PASSWORD"
          subtitle={LAST_CHANGED_EMPTY_STATE}
          isEditing={desktop.isEditing}
          onEdit={desktop.edit}
          onCancel={desktop.cancel}
        >
          {desktop.isEditing ? (
            <form
              noValidate
              onSubmit={desktop.handleSubmit}
              className="flex flex-col gap-[16px]"
            >
              <PasswordFields idPrefix="password-desktop" errors={desktop.errors} />
              <div className="flex items-center gap-[12px]">
                <Button type="submit" variant="save">
                  Update password
                </Button>
                <p className="text-[12.5px] text-muted-foreground">
                  At least 8 characters. You’ll stay logged in on this device.
                </p>
              </div>
            </form>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Change your password to keep your account secure.
            </p>
          )}
        </ProfileCard>
      </div>

      {/* Mobile: a single row, not a header-plus-body card — the frame
          (`2047:1169`) draws no border between the title block and the
          Change button, unlike every other card on this screen. */}
      <div className="flex items-center justify-between gap-[12px] rounded-sm border border-rule bg-card px-[14px] py-[14px] md:hidden">
        <div className="flex flex-col gap-[2px]">
          <h2 className="font-display text-[15px] tracking-[0.3px] text-foreground">
            PASSWORD
          </h2>
          <span className="text-[12px] text-muted-foreground">
            {LAST_CHANGED_EMPTY_STATE}
          </span>
        </div>
        <button
          type="button"
          onClick={mobile.edit}
          className="shrink-0 rounded-sm border border-rule bg-card px-[15px] py-[11px] text-[13px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Change
        </button>
      </div>

      <Dialog
        open={mobile.isEditing}
        onClose={mobile.cancel}
        title="CHANGE PASSWORD"
        footer={
          <>
            <Button variant="outline" className="flex-1 p-[14px]" onClick={mobile.cancel}>
              Cancel
            </Button>
            <Button variant="confirm" className="flex-1" type="submit" form="password-mobile-form">
              Update
            </Button>
          </>
        }
      >
        {/* Only rendered while open, so its fields never sit hidden in the
            desktop layout's tab order. */}
        {mobile.isEditing ? (
          <form
            id="password-mobile-form"
            noValidate
            onSubmit={mobile.handleSubmit}
            className="flex flex-col gap-[14px]"
          >
            <PasswordFields idPrefix="password-mobile" errors={mobile.errors} />
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}

/**
 * The three fields plus the strength meter, shared between the desktop
 * card's inline form and the mobile dialog's form. `idPrefix` keeps their
 * ids apart — both trees are mounted at once, one hidden by CSS rather than
 * unmounted, so duplicate ids would otherwise reach the DOM together.
 */
function PasswordFields({
  idPrefix,
  errors,
}: {
  idPrefix: string;
  errors: Partial<Record<PasswordChangeField, string>>;
}) {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");

  const strength = passwordStrength(newPassword);

  return (
    <div className="grid gap-[12px] md:grid-cols-3 md:gap-[14px]">
      <CardField
        label="Current password"
        htmlFor={`${idPrefix}-current`}
        action={
          <ShowHideToggle
            shown={showCurrent}
            onToggle={() => setShowCurrent((shown) => !shown)}
          />
        }
        error={errors.currentPassword}
      >
        <CardInput
          id={`${idPrefix}-current`}
          name="currentPassword"
          type={showCurrent ? "text" : "password"}
          autoComplete="current-password"
          invalid={Boolean(errors.currentPassword)}
        />
      </CardField>

      <CardField
        label="New password"
        htmlFor={`${idPrefix}-new`}
        action={
          <ShowHideToggle
            shown={showNew}
            onToggle={() => setShowNew((shown) => !shown)}
          />
        }
        error={errors.newPassword}
      >
        <CardInput
          id={`${idPrefix}-new`}
          name="newPassword"
          type={showNew ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          invalid={Boolean(errors.newPassword)}
        />
        {/* Advisory only — it never gates the submit button. The one real
            rule is the shared minimum length `passwordChangeSchema` checks. */}
        {newPassword ? (
          <div className="flex items-center gap-[8px] pt-[2px]">
            <div className="h-[5px] flex-1 overflow-hidden rounded-pill bg-rule">
              <div
                className="h-full rounded-pill bg-[#3f6b4a] transition-[width]"
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[11.5px] font-bold text-[#3f6b4a]">
              {strength.label}
            </span>
          </div>
        ) : null}
      </CardField>

      <CardField
        label="Confirm new password"
        htmlFor={`${idPrefix}-confirm`}
        action={
          <ShowHideToggle
            shown={showConfirm}
            onToggle={() => setShowConfirm((shown) => !shown)}
          />
        }
        error={errors.confirmPassword}
      >
        <CardInput
          id={`${idPrefix}-confirm`}
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
        />
      </CardField>
    </div>
  );
}
