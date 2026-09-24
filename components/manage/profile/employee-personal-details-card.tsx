"use client";

/**
 * Employee Personal Details Card
 * 
 * What's Added/Changed:
 * - Composed the Employee Personal Details using the shared `ProfileCard` pattern.
 * - Added a toggleable "Edit" mode that reveals a form for the Full Name and Date of Birth.
 * - Leveraged `useCardEditor` hook for state management and basic validation.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Replace the dummy `SAVE_TOAST` with actual mutation logic via Supabase to update the employee record.
 * - [ ] Populate `profile.name` and `profile.dateOfBirth` with live session data instead of mock values.
 * - [ ] Enhance validation error messaging if backend rejects the update.
 */

import { useRouter } from "next/navigation";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { lengthProps } from "@/lib/validation/fields";
import { earliestBirthdate, latestBirthdateForMinAge } from "@/lib/validation/date-of-birth";
import { useToast } from "@/components/ui/toast";
import { employeePersonalDetailsSchema } from "@/lib/validation/employee-profile";

export function EmployeePersonalDetailsCard({
  profile,
}: {
  profile: { firstName: string; lastName: string; dateOfBirth: string | null };
}) {
  const showToast = useToast();
  const router = useRouter();
  const { isEditing, isSubmitting, isValid, edit, cancel, errors, formProps, handleSubmit } = useCardEditor({
    schema: employeePersonalDetailsSchema,
    read: (form) => ({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
    }),
    onValid: async (values) => {
      try {
        const res = await fetch("/api/employee/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            dateOfBirth: values.dateOfBirth,
          }),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your personal details.");
          return json.fieldErrors ? { fieldErrors: json.fieldErrors } : false;
        }

        showToast("Personal details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your personal details. Check your connection.");
        return false;
      }
    },
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
          {...formProps}
          onSubmit={handleSubmit}
          className="flex flex-col gap-[12px] md:gap-[16px]"
        >
          <div className="grid gap-[12px] md:grid-cols-3 md:gap-[24px]">
            <CardField label="First name" htmlFor="firstName" error={errors.firstName}>
              <CardInput
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                defaultValue={profile.firstName}
                {...lengthProps("firstName")}
                invalid={Boolean(errors.firstName)}
              />
            </CardField>

            <CardField label="Last name" htmlFor="lastName" error={errors.lastName}>
              <CardInput
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                defaultValue={profile.lastName}
                {...lengthProps("lastName")}
                invalid={Boolean(errors.lastName)}
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
                min={earliestBirthdate()}
                max={latestBirthdateForMinAge()}
                invalid={Boolean(errors.dateOfBirth)}
              />
            </CardField>
          </div>

          <SubmitButton
            variant="save"
            pending={isSubmitting}
            invalid={!isValid}
            pendingLabel="Saving..."
            hint="Save your personal details"
          >
            Save changes
          </SubmitButton>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-3 md:gap-[24px]">
          <CardField label="First name">
            <CardValue value={profile.firstName} emptyState="Not added yet" />
          </CardField>
          <CardField label="Last name">
            <CardValue value={profile.lastName} emptyState="Not added yet" />
          </CardField>
          <CardField label="Date of birth">
            <CardValue
              value={profile.dateOfBirth || ""}
              emptyState="Not added yet"
            />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
