import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Policy - Yang's Fried Rice",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen bg-[#fbf6ec]">
      {/* Left side: Content */}
      <div className="flex-1 overflow-y-auto px-[30px] py-[40px] md:px-[60px] md:py-[60px]">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-block mb-8 text-[14px] text-[#e8541f] font-bold hover:underline">
            &larr; Back to Home
          </Link>
          <h1 className="font-display text-[32px] md:text-[40px] text-[#1a1210] mb-8 uppercase">
            Terms & Policy
          </h1>
          
          <div className="space-y-8 text-[15px] md:text-[16px] text-[#7a6a60] leading-relaxed bg-white p-6 md:p-10 rounded-[16px] border border-[#ddcdb8]">
            <section>
              <h2 className="text-[20px] font-bold text-[#1a1210] mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Yang&apos;s Fried Rice website and ordering system, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-[20px] font-bold text-[#1a1210] mb-3">2. Ordering & Payment</h2>
              <p>
                All orders placed through our platform are subject to acceptance and availability. Prices are subject to change without notice. We accept various forms of payment, including digital wallets (GCash, Maya), credit/debit cards, and cash on delivery. By providing payment information, you represent and warrant that you are authorized to use the designated payment method.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-[#1a1210] mb-3">3. Delivery & ETA</h2>
              <p>
                Estimated delivery times (ETA) are provided dynamically based on our real-time kitchen queue and your delivery distance. However, these are estimates and are not guaranteed. Actual delivery times may vary depending on unexpected traffic or weather conditions. Yang&apos;s Fried Rice is not liable for any reasonable delays.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-[#1a1210] mb-3">4. Cancellations & Refunds</h2>
              <p>
                Orders can only be cancelled before they are confirmed by the restaurant staff (while in the &quot;pending&quot; state). Once an order&apos;s status changes from pending to confirmed, cancellations are no longer permitted to prevent food waste. Refunds for digital payments will be processed according to our payment gateway provider&apos;s standard timelines.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-[#1a1210] mb-3">5. Privacy Policy</h2>
              <p>
                We respect your privacy. Any personal information you provide, including delivery addresses, contact numbers, and order history, will be used solely for the purpose of processing your orders and improving your experience. We do not sell your personal data to third parties.
              </p>
            </section>
          </div>
        </div>
      </div>
      
      {/* Right side: Image (reusing login hero) */}
      <div className="hidden lg:block lg:w-[400px] xl:w-[500px] relative shrink-0">
        <Image
          src="/images/login-hero.jpg"
          alt="Yang's Fried Rice"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
