import Image from "next/image";

/**
 * The red side of the auth screens. Mobile shows only the wordmark and a
 * short tagline; desktop adds the display headline, the longer body copy and
 * the stats row. The copy genuinely differs between the two frames, so both
 * strings are rendered and toggled rather than one being truncated.
 */
export function BrandPanel() {
  return (
    <div className="relative flex flex-col px-6 pb-8 pt-[26px] md:bg-primary md:px-[46px] md:py-[48px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
      >
        <Image
          src="/images/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-30"
        />
      </div>

      <p className="relative font-display text-[46px] leading-[43.24px] text-on-brand md:text-[22px] md:leading-normal md:tracking-[0.88px]">
        <span className="block md:inline">YANG&apos;S </span>
        <span className="block text-on-brand-accent md:inline">FRIED RICE</span>
      </p>

      {/* Mobile tagline. The desktop frame uses different, longer copy. */}
      <p className="relative mt-3 max-w-[260px] text-[14px] text-on-brand-muted md:hidden">
        Wok-fired to order. Get it hot at your door.
      </p>

      <div className="relative hidden flex-1 flex-col justify-end pt-[198px] md:flex">
        <h1 className="font-display text-[66px] leading-[62px] text-on-brand">
          WOK-FIRED
          <br />
          TO ORDER.
          <br />
          <span className="text-on-brand-accent">
            HOT AT YOUR
            <br />
            DOOR.
          </span>
        </h1>
        <p className="mt-5 max-w-[380px] text-[15px] leading-[22.5px] text-on-brand-muted">
          Log in to reorder your usual in two taps, keep your delivery addresses
          saved, and track live orders.
        </p>
      </div>

      <div className="relative mt-10 hidden gap-7 border-t border-on-brand-rule pt-[22px] md:flex">
        <Stat value="18 min" label="Avg. delivery" />
        <Stat value="4.8 ★" label="2,140 reviews" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="font-display text-[26px] text-on-brand-accent">{value}</p>
      <p className="text-[11px] uppercase tracking-[1.54px] text-on-brand-subtle">
        {label}
      </p>
    </div>
  );
}
