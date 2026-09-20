"use client";

import { useRouter } from "next/navigation";
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
  type PasswordChangeValues,
} from "@/lib/validation/profile";

const LAST_CHANGED_EMPTY_STATE = "Not tracked yet.";

function formatLastUpdated(isoString: string | null): string {
  if (!isoString) return LAST_CHANGED_EMPTY_STATE;
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Last changed today";
  if (diffDays === 1) return "Last changed 1 day ago";
  if (diffDays < 30) return `Last changed ${diffDays} days ago`;
  
  return `Last changed on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

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
 * Desktop and mobile each get their own `useCardEditor` call (see the
 * original comment on why — both trees are mounted at once), but share one
 * submit function so the actual network call and its error handling can't
 * drift apart between the two.
 *
 * PATCH /api/profile/password verifies currentPassword server-side before
 * allowing the change. A wrong current password surfaces as a toast, not
 * a field-level error — useCardEditor's error state only comes from
 * client-side schema validation, and threading an async server error back
 * into that same state would mean changing the hook's contract, which is
 * shared by every other card on this screen. Worth revisiting if a field-
 * level error becomes a real requirement.
 */
export function PasswordCard({ lastUpdated }: { lastUpdated?: string | null }) {
  const router = useRouter();
  const showToast = useToast();

  async function submitPasswordChange(values: PasswordChangeValues) {
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(json.error ?? "Could not update your password.");
        return false;
      }

      showToast("Password updated.");
      router.refresh();
      return true;
    } catch {
      showToast("Could not update your password. Check your connection.");
      return false;
    }
  }

  const desktop = useCardEditor({
    schema: passwordChangeSchema,
    read: readPasswordForm,
    onValid: submitPasswordChange,
  });
  const mobile = useCardEditor({
    schema: passwordChangeSchema,
    read: readPasswordForm,
    onValid: submitPasswordChange,
  });

  return (
    <div id="password">
      {/* Desktop */}
      <div className="hidden md:block">
        <ProfileCard
          title="PASSWORD"
          subtitle={formatLastUpdated(lastUpdated ?? null)}
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
                <Button type="submit" variant="save" disabled={desktop.isSubmitting}>
                  {desktop.isSubmitting ? "Updating..." : "Update password"}
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

      {/* Mobile */}
      <div className="flex items-center justify-between gap-[12px] rounded-sm border border-rule bg-card px-[14px] py-[14px] md:hidden">
        <div className="flex flex-col gap-[2px]">
          <h2 className="font-display text-[15px] tracking-[0.3px] text-foreground">
            PASSWORD
          </h2>
          <span className="text-[12px] text-muted-foreground">
            {formatLastUpdated(lastUpdated ?? null)}
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
            <Button variant="confirm" className="flex-1" type="submit" form="password-mobile-form" disabled={mobile.isSubmitting}>
              {mobile.isSubmitting ? "Updating..." : "Update"}
            </Button>
          </>
        }
      >
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