import Link from "next/link";
import { AddressValidationNote } from "@/components/checkout/address-validation-note";
import { formatMobileNumber } from "@/lib/profile/mobile-number";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Delivery details (`133:1085`): name and contact side by side, the address
 * below, and the mapping-service note under that.
 *
 * Read-only. The frame draws each value in a bordered box that looks like a
 * text input, but nothing on this screen edits a customer's details — that
 * belongs to `/profile`, and editing here would be a write besides. They are
 * rendered as static values in the same boxes, so the screen matches the
 * frame without offering a control that cannot work.
 *
 * Desktop only in placement; mobile's frame (`132:411`) has no delivery
 * details block at all, showing the address inside the order summary
 * instead.
 */
export function DeliveryDetailsCard({ profile }: { profile: CustomerProfile }) {
  const address = profile.deliverToAddress;

  return (
    <section className="flex flex-col gap-[12px] rounded-lg border border-rule bg-card p-[20px]">
      <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
        Delivery details
      </h2>

      <div className="flex gap-[12px]">
        <Field label="Name" value={profile.name || "Not set"} />
        <Field
          label="Contact"
          value={
            profile.mobile ? formatMobileNumber(profile.mobile) : "Not set"
          }
        />
      </div>

      <Field label="Address" value={address ?? "No saved address"} />

      {/* The gap `profile-page-handoff.md` already records: saving an address
          is a write, so a customer who has never had one written cannot get
          one from here. Rather than an empty box under a validation note
          claiming an address was checked, this says what is missing and
          sends them to the one screen that owns it. */}
      {address ? (
        <AddressValidationNote address={address} />
      ) : (
        <p className="text-[12px] text-muted-foreground">
          You have no saved delivery address yet.{" "}
          <Link href="/profile" className="font-bold text-primary underline">
            Add one in your profile
          </Link>{" "}
          before choosing delivery.
        </p>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-[5px]">
      <span className="text-[11px] font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <p className="rounded-[11px] border border-field-border p-[12px] text-[14px] text-foreground">
        {value}
      </p>
    </div>
  );
}
