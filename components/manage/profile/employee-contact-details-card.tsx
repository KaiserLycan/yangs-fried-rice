"use client";

/**
 * Employee Contact Details Card
 * 
 * What's Added/Changed:
 * - Implemented the Contact Details section mapping to Mobile Number and Email Address.
 * - Converted from a static display to an interactive editing card using `ProfileCard` and `useCardEditor`.
 * - Connected the fields to the `contactDetailsSchema` to enforce proper email and mobile formats.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Implement Supabase backend mutation to actually save contact detail changes.
 * - [ ] Connect `profile` prop to live session data.
 */

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import { contactDetailsSchema } from "@/lib/validation/profile";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  PH_MOBILE_EXAMPLE,
  formatMobileNumber,
  toInternationalMobile,
} from "@/lib/validation/phone";

const SAVE_TOAST =
  "Saving your contact details isn’t available yet. We’re still building it.";

export function EmployeeContactDetailsCard({
  profile,
}: {
  profile: { mobile: string; email: string };
}) {
  const showToast = useToast();
  const router = useRouter();
  const { isEditing, isSubmitting, isValid, edit, cancel, errors, formProps, handleSubmit } = useCardEditor({
    schema: contactDetailsSchema,
    read: (form) => ({
      mobile: toInternationalMobile(String(form.get("mobile") ?? "")),
      email: String(form.get("email") ?? ""),
    }),
    onValid: async (values) => {
      const body: { mobile?: string } = {};

      if (values.mobile !== profile.mobile) {
        body.mobile = values.mobile;
      }

      if (Object.keys(body).length === 0) {
        showToast("No changes to save.");
        return;
      }

      try {
        const res = await fetch("/api/employee/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your contact details.");
          return json.fieldErrors ? { fieldErrors: json.fieldErrors } : false;
        }

        showToast("Contact details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your contact details. Check your connection.");
        return false;
      }
    },
  });

  return (
    <ProfileCard
      title="CONTACT DETAILS"
      isEditing={isEditing}
      onEdit={edit}
      onCancel={cancel}
    >
      {isEditing ? (
        <form
          {...formProps}
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px] md:gap-[16px]"
        >
          <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
            <CardField
              label="Mobile number"
              htmlFor="mobile"
              hint={`Format: ${PH_MOBILE_EXAMPLE}`}
              error={errors.mobile}
            >
              <PhoneInput
                id="mobile"
                name="mobile"
                defaultValue={profile.mobile}
                invalid={Boolean(errors.mobile)}
                className={cn(
                  "rounded-sm border bg-card",
                  errors.mobile ? "border-error-border" : "border-field-border",
                )}
                prefixClassName="pl-[12px] text-[15px] text-muted-foreground md:text-[14px]"
                inputClassName="px-[6px] py-[13px] text-[15px] md:py-[11px] md:text-[14px]"
              />
            </CardField>

            <CardField label="Email address" htmlFor="email" error={errors.email}>
              <CardInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile.email}
                invalid={Boolean(errors.email)}
                readOnly
                className="cursor-not-allowed opacity-60"
              />
            </CardField>
          </div>

          <SubmitButton
            variant="save"
            pending={isSubmitting}
            invalid={!isValid}
            pendingLabel="Saving..."
            hint="Save your mobile number"
          >
            Save changes
          </SubmitButton>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
          <CardField label="Mobile number">
            <CardValue
              value={formatMobileNumber(profile.mobile)}
              emptyState="Not added yet"
            />
          </CardField>
          <CardField label="Email address">
            <CardValue value={profile.email} emptyState="Not added yet" />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
