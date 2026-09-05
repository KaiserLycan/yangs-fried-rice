"use client";

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
import { formatDateOfBirth } from "@/lib/profile/identity";
import { personalDetailsSchema } from "@/lib/validation/profile";

const SAVE_TOAST =
  "Saving your personal details isn’t available yet. We’re still building it.";

/**
 * Full name and date of birth (Cust4).
 *
 * The name is a real column and reads live. Date of birth has no column yet —
 * it is confirmed as coming and confirmed as optional when it lands — so it
 * renders with an empty state rather than being hidden, and nothing here
 * invents a value for it.
 *
 * Saving raises a toast and writes nothing. Server-side work on this screen
 * belongs to the backend developer; see
 * `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export function PersonalDetailsCard({ profile }: { profile: CustomerProfile }) {
  const showToast = useToast();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: personalDetailsSchema,
    read: (form) => ({
      name: String(form.get("name") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
    }),
    onValid: () => showToast(SAVE_TOAST),
  });

  return (
    <ProfileCard
      title="PERSONAL DETAILS"
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
            <CardField label="Full name" htmlFor="name" error={errors.name}>
              <CardInput
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                defaultValue={profile.name}
                invalid={Boolean(errors.name)}
              />
            </CardField>

            <CardField
              label="Date of birth"
              htmlFor="dateOfBirth"
              hint="Optional. We use it for birthday offers."
              error={errors.dateOfBirth}
            >
              <CardInput
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                autoComplete="bday"
                defaultValue={profile.dateOfBirth ?? ""}
                invalid={Boolean(errors.dateOfBirth)}
              />
            </CardField>
          </div>

          <Button type="submit" variant="save">
            Save changes
          </Button>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
          <CardField label="Full name">
            <CardValue value={profile.name} emptyState="Not added yet" />
          </CardField>
          <CardField label="Date of birth">
            <CardValue
              value={formatDateOfBirth(profile.dateOfBirth)}
              emptyState="Not added yet"
            />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
