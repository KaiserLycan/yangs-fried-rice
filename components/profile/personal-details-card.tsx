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

/**
 * Full name and date of birth (Cust4).
 *
 * The name is a real column and reads live, and now writes live too, via
 * PATCH /api/profile (lib/actions/profile.ts). Date of birth has no column
 * yet — it's validated here so the request shape is already correct the
 * day it lands, but it is NOT sent in the request body below: the backend
 * has nowhere to put it yet, and sending a field it silently can't persist
 * would be worse than just not sending it.
 */
export function PersonalDetailsCard({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const showToast = useToast();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
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
          body: JSON.stringify({ name: values.name }),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your details.");
          return;
        }

        showToast("Personal details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your details. Check your connection.");
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