"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { formatMobileNumber } from "@/lib/profile/mobile-number";
import { contactDetailsSchema } from "@/lib/validation/profile";

const MOBILE_HINT = "We text this number about your delivery.";

const EMAIL_NOTE = "This is the email you sign in with.";

const EMAIL_EDITING_HINT = "A new email needs verifying before your next order.";

/**
 * Mobile number and email address (Cust4).
 *
 * The two fields are submitted together by this form (contactDetailsSchema
 * requires both), but only sent to the backend when they've actually
 * changed — otherwise saving after only editing the mobile number would
 * also silently re-trigger an email re-confirmation for an address that
 * never changed.
 *
 * Email doesn't take effect immediately: PATCH /api/profile calls
 * supabase.auth.updateUser under the hood, which sends a confirmation link
 * to the new address rather than switching it right away. The toast
 * reflects that rather than claiming the change is done.
 */
export function ContactDetailsCard({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const showToast = useToast();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: contactDetailsSchema,
    read: (form) => ({
      mobile: String(form.get("mobile") ?? "").replace(/[^0-9]/g, "")
        ? `+63${String(form.get("mobile") ?? "").replace(/[^0-9]/g, "")}`
        : "",
      email: String(form.get("email") ?? ""),
    }),
    onValid: async (values) => {
      const body: { mobile?: string; email?: string } = {};

      if (values.mobile !== (profile.mobile ?? "")) {
        body.mobile = values.mobile;
      }
      if (values.email !== profile.email) {
        body.email = values.email;
      }

      if (Object.keys(body).length === 0) {
        showToast("No changes to save.");
        return;
      }

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your contact details.");
          return;
        }

        if (body.email) {
          showToast(
            body.mobile
              ? "Mobile number updated. Check your new email to confirm the change."
              : "Check your new email to confirm the change.",
          );
        } else {
          showToast("Contact details saved.");
        }
        router.refresh();
      } catch {
        showToast("Could not save your contact details. Check your connection.");
      }
    },
  });

  return (
    <ProfileCard
      id="contact"
      title="CONTACT DETAILS"
      isEditing={isEditing}
      onEdit={edit}
      onCancel={cancel}
    >
      {isEditing ? (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px] md:gap-[16px]"
        >
          <div className="grid gap-[12px] md:grid-cols-2 md:gap-[24px]">
            <CardField
              label="Mobile number"
              htmlFor="mobile"
              hint={MOBILE_HINT}
              error={errors.mobile}
            >
              <div
                className={cn(
                  "flex w-full items-center rounded-md border bg-white focus-within:ring-2 focus-within:ring-ring/40",
                  errors.mobile ? "border-error-border" : "border-field-border"
                )}
              >
                <span className="pl-[14px] text-[15px] text-muted-foreground select-none pointer-events-none">+63</span>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={formatMobileNumber(profile.mobile).replace("+63 ", "")}
                  maxLength={10}
                  minLength={8}
                  className="w-full bg-transparent px-[6px] py-[13px] text-[15px] text-foreground placeholder:text-placeholder focus:outline-none md:py-[14px]"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                  }}
                />
              </div>
            </CardField>

            <CardField
              label="Email address"
              htmlFor="email"
              hint={EMAIL_EDITING_HINT}
              error={errors.email}
            >
              <CardInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile.email}
                minLength={5}
                maxLength={255}
                invalid={Boolean(errors.email)}
              />
            </CardField>
          </div>

          <Button type="submit" variant="save">
            Save changes
          </Button>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[24px]">
          <CardField label="Mobile number" hint={MOBILE_HINT}>
            <CardValue
              value={formatMobileNumber(profile.mobile)}
              emptyState="Not added yet"
            />
          </CardField>
          <CardField label="Email address" hint={EMAIL_NOTE}>
            <CardValue value={profile.email} />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}