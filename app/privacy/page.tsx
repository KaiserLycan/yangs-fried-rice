import Link from "next/link";
import { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  SellerContact,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Notice - Yang's Fried Rice",
};

/**
 * Draft text (issue #116) — the PM reviews it in the pull request. Change
 * `LAST_UPDATED` whenever the text changes.
 */
const LAST_UPDATED = "27 September 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Who we are">
        <p>
          This notice explains how we handle your personal data under the Data
          Privacy Act of 2012 (RA 10173). We decide how your data is used.
        </p>
        <SellerContact />
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account:</strong> first and last name, email, mobile number,
            date of birth, password (stored scrambled, never readable) and an
            optional profile photo.
          </li>
          <li>
            <strong>Orders:</strong> the items, special instructions, totals,
            payment method, and the status and times of each order.
          </li>
          <li>
            <strong>Payments:</strong> the payment reference and whether it went
            through. Your GCash or Maya login stays with PayMongo; we never see
            it.
          </li>
          <li>
            <strong>Senior citizen or PWD discount:</strong> if you claim it,
            the ID number, the name on the ID and a photo of the ID.
          </li>
          <li>
            <strong>Reviews</strong> you leave on an order.
          </li>
          <li>
            <strong>Security logs:</strong> failed sign-in attempts, with the IP
            address and a scrambled copy of the email used.
          </li>
          <li>
            <strong>Cookies:</strong> only the ones that keep you signed in. We
            use no advertising or tracking cookies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Why we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To create your account and sign you in.</li>
          <li>To prepare your order and tell you when it is ready.</li>
          <li>To take payment and give refunds.</li>
          <li>To check that a discount is allowed, as the law requires.</li>
          <li>To keep sales records required by tax law.</li>
          <li>To stop fraud and repeated failed sign-ins.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How long we keep it">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details: until you ask us to delete your account.</li>
          <li>
            Orders and payment records: five years, because tax law requires us
            to keep sales records.
          </li>
          <li>
            Discount ID photo: deleted as soon as your order is completed. The
            ID number and name on the ID stay with the sales record.
          </li>
          <li>Security logs: no longer than needed to stop abuse.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Who we share it with">
        <p>We do not sell your data. Only these parties receive it:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — stores our database, sign-ins and files.
          </li>
          <li>
            <strong>PayMongo</strong> — processes GCash and Maya payments.
          </li>
          <li>
            <strong>Vercel</strong> — hosts this website.
          </li>
          <li>Our store staff, who need it to prepare your order.</li>
          <li>Government agencies, when the law requires it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data stored outside the Philippines">
        <p>
          Supabase and Vercel may store or process your data on servers outside
          the Philippines. We only use providers that protect it with encryption
          and access controls, and we stay responsible for it under Philippine
          law.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>be told how your data is used;</li>
          <li>see a copy of your data;</li>
          <li>correct data that is wrong;</li>
          <li>object to its use, or ask us to delete or block it;</li>
          <li>get your data in a format you can take elsewhere;</li>
          <li>be compensated for damage caused by misuse of your data;</li>
          <li>complain to the National Privacy Commission (privacy.gov.ph).</li>
        </ul>
        <p>
          You can correct most details yourself on your{" "}
          <Link
            href="/profile"
            className="font-bold text-primary hover:underline"
          >
            profile page
          </Link>
          . For anything else, contact us:
        </p>
        <SellerContact />
      </LegalSection>

      <LegalSection title="8. Changes to this notice">
        <p>
          We will update this page if anything changes. The date at the top
          shows the last change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
