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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { personalDetailsSchema } from "@/lib/validation/profile";

const SAVE_TOAST =
  "Saving your personal details isn’t available yet. We’re still building it.";

export function EmployeePersonalDetailsCard({
  profile,
}: {
  profile: { name: string; dateOfBirth: string | null };
}) {
  const showToast = useToast();
  const router = useRouter();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: personalDetailsSchema,
    read: (form) => ({
      name: String(form.get("name") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
    }),
    onValid: async (values) => {
      try {
        const res = await fetch("/api/employee/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            dateOfBirth: values.dateOfBirth || null,
          }),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your personal details.");
          return;
        }

        showToast("Personal details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your personal details. Check your connection.");
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

          <Button type="submit" variant="save" className="w-full md:w-auto self-start">
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
              value={profile.dateOfBirth || ""}
              emptyState="Not added yet"
            />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
