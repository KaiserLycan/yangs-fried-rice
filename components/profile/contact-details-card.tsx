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
 * What the email is for, shown while the card is only displaying values. It
 * explains why this particular field is worth being careful with — it is the
 * customer's sign-in identity, not just somewhere to send a receipt.
 */
const EMAIL_NOTE = "This is the email you sign in with.";

/**
 * What changing it actually costs, shown only while editing. Taken verbatim
 * from the frame.
 *
 * The card must not imply the new address takes effect on submit. Changing a
 * sign-in identity sends a confirmation link, and the address does not switch
 * until that link is followed — until then the *old* one is still what signs
 * the customer in. Saying "saved" at the moment of submission would be a lie
 * the frontend told on the backend's behalf, so the field promises
 * verification instead.
 */
const EMAIL_EDITING_HINT = "A new email needs verifying before your next order.";

/**
 * Mobile number and email address (Cust4).
 *
 * Both fields validate against the rules the auth screens already use —
 * sign-up's for the number, login's for the address — imported rather than
 * restated, so no two screens can drift apart about what a valid value is.
 *
 * The frame's typo helper ("gmial.com looks like a typo") is cut: no
 * requirement asks for it, and a heuristic that second-guesses a customer's
 * own address is a guess that will be wrong for somebody.
 *
 * Saving raises a toast and writes nothing. The email is the more involved of
 * the two writes waiting behind this card — it lands on the customer record
 * and on the authentication record, and the second half completes
 * asynchronously. See `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export function ContactDetailsCard({ profile }: { profile: CustomerProfile }) {
  const showToast = useToast();
  const { isEditing, edit, cancel, errors, handleSubmit } = useCardEditor({
    schema: contactDetailsSchema,
    read: (form) => ({
      mobile: String(form.get("mobile") ?? ""),
      email: String(form.get("email") ?? ""),
    }),
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

            <CardField
              label="Email address"
              htmlFor="email"
              hint={EMAIL_EDITING_HINT}
              error={errors.email}
            >
              {/* Uncontrolled and seeded from the stored address, matching the
                  mobile number beside it — that is what makes Cancel restore
                  the original value without this card holding any state of
                  its own. */}
              <CardInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={profile.email}
                invalid={Boolean(errors.email)}
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
