"use client";

import * as React from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CardField, CardInput } from "@/components/profile/profile-card";
import { lengthProps } from "@/lib/validation/fields";

export type AddressFieldName = "buildingNo" | "street" | "barangay" | "city" | "zip";

export const ADDRESS_FIELD_LABELS: Record<AddressFieldName, string> = {
  buildingNo: "Building / house no.",
  street: "Street",
  barangay: "Barangay",
  city: "City",
  zip: "ZIP code",
};

type Values = Partial<Record<AddressFieldName, string>>;

/**
 * The five atomic parts of a delivery address — building/house no., street,
 * barangay, city, ZIP — as uncontrolled inputs named for the form to read.
 * Used by sign-up (auth field styling), the profile address dialog and
 * checkout (card styling), so the three can't drift apart.
 *
 * Each input carries the same min/max length the schema and the database
 * enforce, and the ZIP box accepts digits only.
 */
export function AddressFields({
  idPrefix,
  variant,
  defaults = {},
  errors = {},
  gapClassName = "gap-[10px] md:gap-[14px]",
}: {
  idPrefix: string;
  variant: "auth" | "card";
  defaults?: Values;
  errors?: Partial<Record<string, string>>;
  gapClassName?: string;
}) {
  const FieldComponent = variant === "auth" ? AuthFieldAdapter : CardField;
  const InputComponent = variant === "auth" ? Input : CardInput;

  const input = (
    name: AddressFieldName,
    extra: React.InputHTMLAttributes<HTMLInputElement> & { placeholder: string },
  ) => (
    <InputComponent
      id={`${idPrefix}-${name}`}
      name={name}
      defaultValue={defaults[name] ?? ""}
      required
      invalid={Boolean(errors[name])}
      aria-describedby={errors[name] ? `${idPrefix}-${name}-error` : undefined}
      {...lengthProps(name)}
      {...extra}
    />
  );

  return (
    <div className={`flex flex-col ${gapClassName}`}>
      <div className={`flex flex-col md:flex-row ${gapClassName}`}>
        <FieldComponent
          className="md:w-[38%]"
          label={`${ADDRESS_FIELD_LABELS.buildingNo} *`}
          htmlFor={`${idPrefix}-buildingNo`}
          error={errors.buildingNo}
          errorId={`${idPrefix}-buildingNo-error`}
        >
          {input("buildingNo", { placeholder: "e.g. Unit 4B, 21", autoComplete: "address-line2" })}
        </FieldComponent>
        <FieldComponent
          className="flex-1"
          label={`${ADDRESS_FIELD_LABELS.street} *`}
          htmlFor={`${idPrefix}-street`}
          error={errors.street}
          errorId={`${idPrefix}-street-error`}
        >
          {input("street", { placeholder: "e.g. Mabini St.", autoComplete: "address-line1" })}
        </FieldComponent>
      </div>

      <FieldComponent
        label={`${ADDRESS_FIELD_LABELS.barangay} *`}
        htmlFor={`${idPrefix}-barangay`}
        error={errors.barangay}
        errorId={`${idPrefix}-barangay-error`}
      >
        {input("barangay", { placeholder: "e.g. Malate", autoComplete: "address-level3" })}
      </FieldComponent>

      <div className={`flex flex-col md:flex-row ${gapClassName}`}>
        <FieldComponent
          className="flex-1"
          label={`${ADDRESS_FIELD_LABELS.city} *`}
          htmlFor={`${idPrefix}-city`}
          error={errors.city}
          errorId={`${idPrefix}-city-error`}
        >
          {input("city", { placeholder: "e.g. Manila", autoComplete: "address-level2" })}
        </FieldComponent>
        <FieldComponent
          className="md:w-[30%]"
          label={`${ADDRESS_FIELD_LABELS.zip} *`}
          htmlFor={`${idPrefix}-zip`}
          error={errors.zip}
          errorId={`${idPrefix}-zip-error`}
        >
          {input("zip", {
            placeholder: "e.g. 1004",
            inputMode: "numeric",
            autoComplete: "postal-code",
            pattern: "\\d{4}",
            // Digits only, as typed or pasted — a ZIP is exactly four.
            onInput: (event) => {
              const el = event.currentTarget;
              const digits = el.value.replace(/\D/g, "").slice(0, 4);
              if (el.value !== digits) el.value = digits;
            },
          })}
        </FieldComponent>
      </div>
    </div>
  );
}

/** `Field` with the same props shape as `CardField`, so either can be used above. */
function AuthFieldAdapter({
  label,
  htmlFor,
  error,
  errorId,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field
      className={className}
      label={label}
      htmlFor={htmlFor ?? ""}
      error={error}
      errorId={errorId}
    >
      {children}
    </Field>
  );
}
