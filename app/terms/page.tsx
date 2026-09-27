import Link from "next/link";
import { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";
import { PICKUP_COUNTER } from "@/lib/site/site-info";

export const metadata: Metadata = {
  title: "Terms and Policy - Yang's Fried Rice",
};

export default function TermsPage() {
  return (
    <AuthShell brand={<BrandPanel />}>
      <div className="relative flex flex-col px-6 pb-[30px] pt-[30px] md:bg-background md:px-[52px] md:py-[48px]">
        <div className="flex flex-col gap-[14px] rounded-[22px] bg-background p-5 shadow-sm md:gap-[18px] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <Link href="/" className="inline-block text-[14px] text-accent font-bold hover:underline w-fit">
            &larr; Back
          </Link>
          
          <h1 className="font-display text-[32px] md:text-[40px] text-accent uppercase mt-2">
            Terms & Policy
          </h1>
          
          <div className="space-y-6 text-[15px] md:text-[16px] text-muted-foreground leading-relaxed mt-4">
            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Yang&apos;s Fried Rice website and ordering system, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">2. Ordering & Payment</h2>
              <p>
                All orders placed through our platform are subject to acceptance and availability. Prices are subject to change without notice. You can pay online with a digital wallet (GCash or Maya) or pay at the counter when you pick up. We do not take card payments. By paying, you confirm that you are authorized to use the payment method you chose.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">3. Pickup</h2>
              <p>
                Every order is for pickup at the store &mdash; we do not deliver. We will notify you in the app when your order is ready; collect it at {PICKUP_COUNTER} and say your order number. Ready times are estimates based on our kitchen queue and are not guaranteed.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">4. Cancellations & Refunds</h2>
              <p>
                You can cancel an order while it is still waiting for the kitchen. Once the kitchen has started preparing it, it can no longer be cancelled, to prevent food waste. The store may cancel an order (for example, if an item runs out); if it does, we will tell you why by email and in the app.
              </p>
              <p className="mt-2">
                If you already paid for an order that is cancelled, the store refunds you: a wallet payment goes back to the same wallet, and a counter payment is refunded at {PICKUP_COUNTER}. Refunds are handled by our staff, so we will let you know once yours has been sent.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">5. Missing, Wrong or Damaged Items</h2>
              <p>
                If something was missing, wrong or damaged, report it from your order page within 24 hours of pickup. You can mark the affected items and add a photo if you like. Our staff will review the report and contact you. One report can be filed per order; after 24 hours, please speak to the store directly.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">6. Privacy Policy</h2>
              <p>
                We respect your privacy. The personal information you provide &mdash; your name, contact details, order history and any photo you attach to a problem report &mdash; is used only to process your orders, keep you updated about them, and deal with any problem you report. Order emails are sent through our email provider, Resend. Problem-report photos are private: only you and our staff can see them. When you delete your account, your photos are deleted with it. We do not sell your personal data to third parties.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
