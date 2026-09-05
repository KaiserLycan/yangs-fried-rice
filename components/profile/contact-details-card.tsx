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
import { formatMobileNumber } from "@/lib/profile/mobile-number";
import { contactDetailsSchema } from "@/lib/validation/profile";

const SAVE_TOAST =
  "Saving your contact details isn’t available yet. We’re still building it.";

const MOBILE_HINT = "We text this number about your delivery.";

/**
 * Why the email field is read-only. It is the customer's sign-in identity as
 * well as a stored column, so changing it is a write to two systems with an
 * asynchronous verification step in between — its own ticket, not this one.
 * The note names something a customer can actually do today rather than
 * pointing at an unbuilt screen.
 */
const EMAIL_NOTE = "This is your sign-in email. Ask us if you need it changed.";

/**
 * Mobile number and email address (Cust4).
 *
 * The mobile number validates against the same rule the sign-up screen uses —
 * imported from `lib/validation/signup.ts` rather than restated, so the two
 * screens cannot drift apart about what a valid number is.
 *
 * The frame's typo helper ("gmial.com looks like a typo") is cut: no
 * requirement asks for it, and a heuristic that second-guesses a customer's
 * own address is a guess that will be wrong for somebody.
 *
 * Saving raises a toast and writes nothing. See
 * `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export function ContactDetailsCard({ profile }: { profile: CustomerProfile }) {
  const showToast = useToast();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: contactDetailsSchema,
    read: (form) => ({ mobile: String(form.get("mobile") ?? "") }),
    onValid: () => showToast(SAVE_TOAST),
  });

  return (
    <ProfileCard
      id="contact"
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
          <div className="grid gap-[12px] md:grid-cols-2 md:gap-[24px]">
            <CardField
              label="Mobile number"
              htmlFor="mobile"
              hint={MOBILE_HINT}
              error={errors.mobile}
            >
              {/* Seeded with the grouped form because that is what the
                  editing frame draws. Safe to submit: the validator strips
                  separators, and the grouping is lossless. */}
              <CardInput
                id="mobile"
                name="mobile"
                type="tel"
                autoComplete="tel"
                defaultValue={formatMobileNumber(profile.mobile)}
                invalid={Boolean(errors.mobile)}
              />
            </CardField>

            <CardField label="Email address" hint={EMAIL_NOTE}>
              {/* Disabled rather than readOnly: readOnly still takes focus
                  and still submits, and the requirement is that this field
                  can do neither. It has no `name` either, so even a hand-made
                  submission cannot carry an email through this form. */}
              <CardInput
                type="email"
                value={profile.email}
                disabled
                aria-label="Email address"
                className="bg-background text-foreground"
              />
            </CardField>
          </div>

          <Button type="submit" variant="save">
            Save changes
          </Button>
        </form>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2 md:gap-[24px]">
          <CardField label="Mobile number" hint={MOBILE_HINT}>
            <CardValue
              value={formatMobileNumber(profile.mobile)}
              emptyState="Not added yet"
            />
          </CardField>
          <CardField label="Email address" hint={EMAIL_NOTE}>
            <CardValue value={profile.email} />
          </CardField>
        </div>
      )}
    </ProfileCard>
  );
}
