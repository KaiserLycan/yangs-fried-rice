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

      <p className="relative font-display text-5xl leading-[43.24px] text-on-brand md:text-2xl md:leading-normal md:tracking-[0.88px]">
        <span className="block md:inline">YANG&apos;S </span>
        <span className="block text-on-brand-accent md:inline">FRIED RICE</span>
      </p>

      {/* Mobile tagline. The desktop frame uses different, longer copy. */}
      <p className="relative mt-3 max-w-[260px] text-sm text-on-brand-muted md:hidden">
        Wok-fired to order. Pick it up hot at the counter.
      </p>

      <div className="relative hidden flex-col pt-[198px] md:mb-10 md:flex">
        <h1 className="font-display text-6xl leading-[62px] text-on-brand">
          WOK-FIRED
          <br />
          TO ORDER.
          <br />
          <span className="text-on-brand-accent">
            HOT AT THE
            <br />
            COUNTER.
          </span>
        </h1>
        <p className="mt-5 max-w-[380px] text-base leading-[22.5px] text-on-brand-muted">
          Log in to reorder your usual in one tap, get told the moment your
          order is ready, and pick it up hot at the counter.
        </p>
      </div>

      {/* The auto top margin is what keeps surplus height out of the middle
          of the panel. It absorbs every leftover pixel in the column, so on a
          window taller than the drawn frame the extra space opens up here,
          below the body copy, instead of pooling in the wordmark-to-headline
          gap. The designed 40px of that gap comes from the headline block's
          own bottom margin rather than a top margin here, because an auto
          margin collapses to zero when there is no surplus and the gap would
          vanish at the drawn height. */}
      <div className="relative hidden gap-7 border-t border-on-brand-rule pt-[22px] md:mt-auto md:flex">
        <Stat value="18 min" label="Avg. prep time" />
        <Stat value="4.8 ★" label="2,140 reviews" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="font-display text-2xl text-on-brand-accent">{value}</p>
      <p className="text-sm uppercase tracking-[1.54px] text-on-brand-subtle">
        {label}
      </p>
    </div>
  );
}
