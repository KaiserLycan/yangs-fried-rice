"use client";

import { useRouter } from "next/navigation";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { formatDateOfBirth } from "@/lib/profile/identity";
import { lengthProps } from "@/lib/validation/fields";
import { personalDetailsSchema } from "@/lib/validation/profile";
import { earliestBirthdate, latestBirthdateForMinAge } from "@/lib/validation/date-of-birth";

/**
 * First name, last name and date of birth (Cust4), saved via PATCH
 * /api/profile (lib/actions/profile.ts).
 *
 * Validated live against the same rules as sign-up; Save stays disabled until
 * they pass, and a server rejection is shown under the field it names.
 */
export function PersonalDetailsCard({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const showToast = useToast();
  const { isEditing, isSubmitting, isValid, edit, cancel, errors, formProps, handleSubmit } =
    useCardEditor({
      schema: personalDetailsSchema,
      read: (form) => ({
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      }),
      onValid: async (values) => {
        try {
          const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          const json = await res.json();

          if (!res.ok) {
            showToast(json.error ?? "Could not save your details.");
            return json.fieldErrors ? { fieldErrors: json.fieldErrors } : false;
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
              value={formatDateOfBirth(profile.dateOfBirth)}
              emptyState="Not added yet"
            />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
