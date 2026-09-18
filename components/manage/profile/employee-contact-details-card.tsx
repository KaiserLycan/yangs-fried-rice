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
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { contactDetailsSchema } from "@/lib/validation/profile";

const SAVE_TOAST =
  "Saving your contact details isn’t available yet. We’re still building it.";

export function EmployeeContactDetailsCard({
  profile,
}: {
  profile: { mobile: string; email: string };
}) {
  const showToast = useToast();
  const router = useRouter();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: contactDetailsSchema,
    read: (form) => ({
      mobile: String(form.get("mobile") ?? ""),
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
          return;
        }

        showToast("Contact details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your contact details. Check your connection.");
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
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px] md:gap-[16px]"
        >
          <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
            <CardField label="Mobile number" htmlFor="mobile" error={errors.mobile}>
              <CardInput
                id="mobile"
                name="mobile"
                type="tel"
                autoComplete="tel"
                defaultValue={profile.mobile}
                invalid={Boolean(errors.mobile)}
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

          <Button type="submit" variant="save" className="w-full md:w-auto self-start">
            Save changes
          </Button>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
          <CardField label="Mobile number">
            <CardValue value={profile.mobile} emptyState="Not added yet" />
          </CardField>
          <CardField label="Email address">
            <CardValue value={profile.email} emptyState="Not added yet" />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
