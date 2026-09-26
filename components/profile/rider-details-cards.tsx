"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  CardField,
  CardInput,
  CardValue,
  ProfileCard,
} from "@/components/profile/profile-card";
import { useCardEditor } from "@/components/profile/use-card-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  lengthProps,
  vehicleMakeModelSchema,
  vehiclePlateNumberSchema,
} from "@/lib/validation/fields";
import { useToast } from "@/components/ui/toast";

/**
 * Role and shift are assigned by a manager (see the manager-only gate in
 * `updateMyEmployeeProfile`), so this card is read-only: no Edit control, no
 * inputs. A rider can see what they have been assigned, not rewrite it.
 */
export function EmployeeDetailsCard({
  role,
  shift,
}: {
  role: string;
  shift: string;
}) {
  return (
    <ProfileCard
      title="EMPLOYEE DETAILS"
      subtitle="Set by your manager"
      isEditing={false}
      showEditButton={false}
      onEdit={() => {}}
      onCancel={() => {}}
    >
      <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
        <CardField label="Role">
          <CardValue value={role} emptyState="Not added yet" />
        </CardField>
        <CardField label="Shift">
          <CardValue value={shift} emptyState="Not added yet" />
        </CardField>
      </div>
    </ProfileCard>
  );
}

const driverDetailsSchema = z.object({
  vehicleMakeModel: vehicleMakeModelSchema,
  vehiclePlateNumber: vehiclePlateNumberSchema,
});

export function DriverDetailsCard({
  vehicleMakeModel,
  vehiclePlateNumber,
}: {
  vehicleMakeModel: string;
  vehiclePlateNumber: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const { isEditing, isSubmitting, isValid, edit, cancel, errors, formProps, handleSubmit } = useCardEditor({
    schema: driverDetailsSchema,
    read: (form) => ({
      vehicleMakeModel: String(form.get("vehicleMakeModel") ?? ""),
      vehiclePlateNumber: String(form.get("vehiclePlateNumber") ?? ""),
    }),
    onValid: async (values) => {
      const body: { vehicleMakeModel?: string; vehiclePlateNumber?: string } = {};

      if (values.vehicleMakeModel !== vehicleMakeModel) {
        body.vehicleMakeModel = values.vehicleMakeModel;
      }
      if (values.vehiclePlateNumber !== vehiclePlateNumber) {
        body.vehiclePlateNumber = values.vehiclePlateNumber;
      }

      if (Object.keys(body).length === 0) {
        showToast("No changes to save.");
        return;
      }

      try {
        const res = await fetch("/api/employee/profile/rider", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();

        if (!res.ok) {
          showToast(json.error ?? "Could not save your driver details.");
          return json.fieldErrors ? { fieldErrors: json.fieldErrors } : false;
        }

        showToast("Driver details saved.");
        router.refresh();
      } catch {
        showToast("Could not save your driver details. Check your connection.");
        return false;
      }
    },
  });

  return (
    <ProfileCard
      title="DRIVER DETAILS"
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
              label="Vehicle Make Model"
              htmlFor="vehicleMakeModel"
              error={errors.vehicleMakeModel}
            >
              <CardInput
                id="vehicleMakeModel"
                name="vehicleMakeModel"
                type="text"
                defaultValue={vehicleMakeModel}
                placeholder="e.g. Honda Click 125i"
                {...lengthProps("vehicleMakeModel")}
                invalid={Boolean(errors.vehicleMakeModel)}
              />
            </CardField>

            <CardField
              label="Vehicle Plate Number"
              htmlFor="vehiclePlateNumber"
              error={errors.vehiclePlateNumber}
            >
              <CardInput
                id="vehiclePlateNumber"
                name="vehiclePlateNumber"
                type="text"
                defaultValue={vehiclePlateNumber}
                placeholder="e.g. ABC 1234"
                {...lengthProps("vehiclePlateNumber")}
                invalid={Boolean(errors.vehiclePlateNumber)}
              />
            </CardField>
          </div>
          <SubmitButton
            variant="save"
            pending={isSubmitting}
            invalid={!isValid}
            pendingLabel="Saving..."
            hint="Save your vehicle details"
          >
            Save changes
          </SubmitButton>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[36px]">
          <CardField label="Vehicle Make Model">
            <CardValue value={vehicleMakeModel} emptyState="Not added yet" />
          </CardField>
          <CardField label="Vehicle Plate Number">
            <CardValue value={vehiclePlateNumber} emptyState="Not added yet" />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
