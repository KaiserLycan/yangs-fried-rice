"use client";

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
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { formatDateOfBirth } from "@/lib/profile/identity";
import { personalDetailsSchema } from "@/lib/validation/profile";
import { earliestBirthdate, latestBirthdateForMinAge } from "@/lib/validation/date-of-birth";

/**
 * Full name and date of birth (Cust4).
 *
 * Both fields read and write live via PATCH /api/profile
 * (lib/actions/profile.ts). The date of birth is validated with the shared
 * rule in `lib/validation/date-of-birth.ts` (not in the future, at least 13,
 * a real calendar date); only the date input itself shows an error, the card
 * around it stays neutral.
 */
export function PersonalDetailsCard({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const showToast = useToast();
  const { isEditing, isSubmitting, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: personalDetailsSchema,
    read: (form) => ({
      name: String(form.get("name") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
    }),
    onValid: async (values) => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: values.name, dateOfBirth: values.dateOfBirth }),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your details.");
          return false;
        }

        showToast("Personal details saved.");
        router.refresh();
        return true;
      } catch {
        showToast("Could not save your details. Check your connection.");
        return false;
      }
    },
  });

  // Local calendar dates (not toISOString, which is UTC and can land a day
  // off). The picker refuses future dates; the schema is the real check.
  const maxDateStr = latestBirthdateForMinAge();
  const minDateStr = earliestBirthdate();

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
                minLength={2}
                maxLength={100}
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
                min={minDateStr}
                max={maxDateStr}
                invalid={Boolean(errors.dateOfBirth)}
              />
            </CardField>
          </div>

          <Button type="submit" variant="save" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
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