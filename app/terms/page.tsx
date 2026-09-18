import Link from "next/link";
import { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";

export const metadata: Metadata = {
  title: "Terms and Policy - Yang's Fried Rice",
};

export default function TermsPage() {
  return (
    <AuthShell brand={<BrandPanel />}>
      <div className="relative flex flex-col px-6 pb-[30px] pt-[30px] md:bg-background md:px-[52px] md:py-[48px]">
        <div className="flex flex-col gap-[14px] rounded-[22px] bg-background p-5 shadow-sm md:gap-[18px] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <Link href="/" className="inline-block text-[14px] text-[#e8541f] font-bold hover:underline w-fit">
            &larr; Back
          </Link>
          
          <h1 className="font-display text-[32px] md:text-[40px] text-[#e8541f] uppercase mt-2">
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
                All orders placed through our platform are subject to acceptance and availability. Prices are subject to change without notice. We accept various forms of payment, including digital wallets (GCash, Maya), credit/debit cards, and cash on delivery. By providing payment information, you represent and warrant that you are authorized to use the designated payment method.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">3. Delivery & ETA</h2>
              <p>
                Estimated delivery times (ETA) are provided dynamically based on our real-time kitchen queue and your delivery distance. However, these are estimates and are not guaranteed. Actual delivery times may vary depending on unexpected traffic or weather conditions. Yang&apos;s Fried Rice is not liable for any reasonable delays.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">4. Cancellations & Refunds</h2>
              <p>
                Orders can only be cancelled before they are confirmed by the restaurant staff (while in the &quot;pending&quot; state). Once an order&apos;s status changes from pending to confirmed, cancellations are no longer permitted to prevent food waste. Refunds for digital payments will be processed according to our payment gateway provider&apos;s standard timelines.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] md:text-[22px] font-display text-foreground mb-2">5. Privacy Policy</h2>
              <p>
                We respect your privacy. Any personal information you provide, including delivery addresses, contact numbers, and order history, will be used solely for the purpose of processing your orders and improving your experience. We do not sell your personal data to third parties.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
