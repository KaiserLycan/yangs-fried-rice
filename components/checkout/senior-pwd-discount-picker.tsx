"use client";

import * as React from "react";
import { AlertCircle, Check, Upload, X } from "lucide-react";
import {
  SENIOR_PWD_ID_MAX_BYTES,
  seniorPwdIdUploadProblem,
} from "@/lib/storage/senior-pwd-ids";
import { Button } from "@/components/ui/button";

export type SeniorPwdDiscountState = {
  enabled: boolean;
  type: "senior_citizen" | "pwd";
  idNumber: string;
  nameOnId: string;
  photo: File | null;
  photoError: string | null;
};

export function SeniorPwdDiscountPicker({
  value,
  onChange,
}: {
  value: SeniorPwdDiscountState;
  onChange: React.Dispatch<React.SetStateAction<SeniorPwdDiscountState>>;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleToggle = () => {
    onChange((prev) => ({
      ...prev,
      enabled: !prev.enabled,
      // Reset errors if turning off
      photoError: !prev.enabled ? prev.photoError : null,
    }));
  };

  const handleTypeChange = (type: "senior_citizen" | "pwd") => {
    onChange((prev) => ({ ...prev, type }));
  };

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange((prev) => ({ ...prev, idNumber: text }));
  };

  const handleNameOnIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange((prev) => ({ ...prev, nameOnId: text }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onChange((prev) => ({ ...prev, photo: null, photoError: null }));
      return;
    }

    const problem = seniorPwdIdUploadProblem(file);
    if (problem) {
      onChange((prev) => ({
        ...prev,
        photo: null,
        photoError: problem,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    onChange((prev) => ({
      ...prev,
      photo: file,
      photoError: null,
    }));
  };

  const handleRemovePhoto = () => {
    onChange((prev) => ({
      ...prev,
      photo: null,
      photoError: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="flex flex-col gap-[14px] md:rounded-lg md:border md:border-rule md:bg-card md:p-[20px]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[1.44px] text-muted-foreground md:tracking-[1.54px]">
          Government Discount
        </h2>
        <span className="text-sm font-semibold text-muted-foreground">
          RA 9994 / RA 10754
        </span>
      </div>

      <Button variant="unstyled"
        type="button"
        role="checkbox"
        aria-checked={value.enabled}
        onClick={handleToggle}
        className="flex min-h-[44px] w-full cursor-pointer items-center gap-[12px] rounded-lg border border-field-border bg-card p-[14px] text-left transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          className={`flex size-[20px] shrink-0 items-center justify-center rounded-sm border transition-colors ${
            value.enabled
              ? "border-accent bg-accent text-accent-foreground"
              : "border-field-border bg-background"
          }`}
        >
          {value.enabled && <Check className="size-[14px] stroke-[3]" />}
        </span>
        <div className="flex flex-col">
          <span className="text-base font-bold text-foreground">
            Apply Senior Citizen or PWD discount
          </span>
          <span className="text-sm text-muted-foreground">
            20% off the whole order and VAT-exempt (one ID per order)
          </span>
        </div>
      </Button>

      {value.enabled && (
        <div className="flex flex-col gap-[16px] rounded-lg border border-rule bg-secondary/20 p-[16px]">
          {/* Discount Type Radio */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-sm font-bold text-foreground">
              Select discount type:
            </span>
            <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2">
              <label
                className={`flex min-h-[44px] cursor-pointer items-center gap-[10px] rounded-md border p-[12px] transition-colors ${
                  value.type === "senior_citizen"
                    ? "border-accent bg-accent/10 font-bold text-foreground"
                    : "border-field-border bg-card text-muted-strong hover:bg-secondary/40"
                }`}
              >
                <input
                  type="radio"
                  name="discount_type"
                  value="senior_citizen"
                  checked={value.type === "senior_citizen"}
                  onChange={() => handleTypeChange("senior_citizen")}
                  className="size-[18px] text-accent focus:ring-accent"
                />
                <span className="text-sm">Senior Citizen</span>
              </label>

              <label
                className={`flex min-h-[44px] cursor-pointer items-center gap-[10px] rounded-md border p-[12px] transition-colors ${
                  value.type === "pwd"
                    ? "border-accent bg-accent/10 font-bold text-foreground"
                    : "border-field-border bg-card text-muted-strong hover:bg-secondary/40"
                }`}
              >
                <input
                  type="radio"
                  name="discount_type"
                  value="pwd"
                  checked={value.type === "pwd"}
                  onChange={() => handleTypeChange("pwd")}
                  className="size-[18px] text-accent focus:ring-accent"
                />
                <span className="text-sm">Person with Disability (PWD)</span>
              </label>
            </div>
          </div>

          {/* ID Number */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="discount-id-number"
              className="text-sm font-bold text-foreground"
            >
              ID number <span className="text-destructive">*</span>
            </label>
            <input
              id="discount-id-number"
              type="text"
              value={value.idNumber}
              onChange={handleIdNumberChange}
              placeholder="e.g. OSCA-2024-1234 or PWD-123456"
              maxLength={40}
              className="min-h-[44px] rounded-md border border-field-border bg-card px-[14px] text-base text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Name on ID */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="discount-name-on-id"
              className="text-sm font-bold text-foreground"
            >
              Name on ID <span className="text-destructive">*</span>
            </label>
            <input
              id="discount-name-on-id"
              type="text"
              value={value.nameOnId}
              onChange={handleNameOnIdChange}
              placeholder="Full name as printed on the ID card"
              maxLength={100}
              className="min-h-[44px] rounded-md border border-field-border bg-card px-[14px] text-base text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* ID Photo Upload */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="discount-id-photo"
              className="text-sm font-bold text-foreground"
            >
              Photo of ID (front) <span className="text-destructive">*</span>
            </label>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 2 MB. Accepted: JPEG, PNG, WebP. ID photos are
              kept in a private bucket, checked by staff at pickup, and deleted
              when the order completes.
            </p>

            <div className="mt-1 flex flex-col gap-2">
              <input
                ref={fileInputRef}
                id="discount-id-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                className="hidden"
              />

              {!value.photo ? (
                <Button variant="unstyled"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-dashed border-field-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Upload className="size-[18px] text-muted-foreground" />
                  <span>Choose ID photo</span>
                </Button>
              ) : (
                <div className="flex items-center justify-between rounded-md border border-field-border bg-card p-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                      {value.photo.name}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      ({(value.photo.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleRemovePhoto}
                    aria-label="Remove photo"
                    className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  >
                    <X className="size-[16px]" />
                  </Button>
                </div>
              )}

              {value.photoError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 text-sm font-semibold text-destructive"
                >
                  <AlertCircle className="size-[16px] shrink-0" />
                  <span>{value.photoError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
