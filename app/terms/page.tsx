import Link from "next/link";
import { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  SellerContact,
} from "@/components/legal/legal-page";
import { PICKUP_COUNTER } from "@/lib/site/site-info";

export const metadata: Metadata = {
  title: "Terms and Policy - Yang's Fried Rice",
};

/**
 * Draft text (issue #116) — the PM reviews it in the pull request. Change
 * `LAST_UPDATED` whenever the text changes.
 */
const LAST_UPDATED = "27 September 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Who we are">
        <SellerContact />
        <p>
          By using this website or placing an order, you agree to these terms.
          How we handle your personal data is in our{" "}
          <Link
            href="/privacy"
            className="font-bold text-accent hover:underline"
          >
            Privacy Notice
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Orders and prices">
        <p>
          All orders are for pickup at the store. We do not deliver. We take
          orders from 8:00 AM to 6:00 PM, Manila time.
        </p>
        <p>
          Prices are in Philippine peso and already include 12% VAT. The price
          you see at checkout is the price you pay.
        </p>
        <p>
          Your order is accepted once our staff confirm it. The ready time we
          show is an estimate based on how many orders are in the kitchen.
        </p>
        <p>
          We will tell you in the app when your order is ready. Collect it at{" "}
          {PICKUP_COUNTER} and say your order number.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment">
        <p>
          You can pay in store when you pick up, or online with GCash or Maya.
          Online payments are handled by PayMongo. We never see or store your
          wallet login. We do not take card payments.
        </p>
      </LegalSection>

      <LegalSection title="4. Cancelling your order">
        <p>
          You can cancel from your order page while the order is still waiting
          for our staff to confirm it. Once confirmed, the kitchen has started
          and the order can no longer be cancelled.
        </p>
      </LegalSection>

      <LegalSection title="5. When we cancel your order">
        <p>
          We may cancel an order if an item runs out, the store has to close, or
          an online payment does not go through. We will tell you why by email
          and in the app.
        </p>
      </LegalSection>

      <LegalSection title="6. Refunds">
        <p>
          If we cancel an order you already paid for online, you get a full
          refund to the same GCash or Maya account. We start the refund within
          one business day. Your wallet may take a few more business days to
          show it.
        </p>
        <p>
          If you cancel before confirmation, the same applies. Pay-in-store
          orders are not charged until pickup, so there is usually nothing to
          refund. If you did pay at the counter, we refund you at{" "}
          {PICKUP_COUNTER}.
        </p>
        <p>We will let you know once your refund has been sent.</p>
      </LegalSection>

      <LegalSection title="7. Missing, wrong or damaged items">
        <p>
          Please check your order at the counter and tell our staff before you
          leave if something is wrong.
        </p>
        <p>
          After you leave, report it from your order page within 24 hours of
          pickup. Mark the affected items and add a photo if you like. Our
          staff will review the report and contact you. One report per order;
          after 24 hours, please contact the store directly.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing law">
        <p>
          These terms follow the laws of the Republic of the Philippines,
          including the Consumer Act (RA 7394) and the Internet Transactions Act
          (RA 11967).
        </p>
      </LegalSection>

      <LegalSection title="9. Complaints">
        <p>
          Please contact us first, and we will reply within three business days.
        </p>
        <SellerContact />
        <p>
          If we cannot resolve it, you can file a complaint with the Department
          of Trade and Industry (DTI) through its hotline, 1-384.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to these terms">
        <p>
          We may update these terms. The date at the top shows the last change.
          Orders already placed follow the terms in force when you ordered.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
