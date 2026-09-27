"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PromoSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  href: string;
  cta: string;
};

const AUTO_ADVANCE_MS = 6000;

/**
 * The landing page's banner carousel — the fast-food-chain hero: one wide
 * banner at a time, a dot per slide, arrows on desktop, swipe on a phone.
 *
 * Swiping is native scroll-snap, so it works without JavaScript and the
 * browser owns the gesture. Auto-advance pauses while the pointer or focus
 * is inside, and is off entirely for anyone who asks for reduced motion.
 */
export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = slides.length;

  const goTo = React.useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const wrapped = (next + track.children.length) % track.children.length;
    track.scrollTo({ left: wrapped * track.clientWidth, behavior: "smooth" });
  }, []);

  // The visible slide follows the scroll position, however it got there.
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [count, paused, index, goTo]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="relative flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.title}`}
            className="relative w-full shrink-0 snap-center"
          >
            <Slide slide={slide} priority={i === 0} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <Button
            variant="unstyled"
            type="button"
            aria-label="Previous promotion"
            onClick={() => goTo(index - 1)}
            className="absolute left-4 top-1/2 hidden size-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md hover:bg-white md:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <Button
            variant="unstyled"
            type="button"
            aria-label="Next promotion"
            onClick={() => goTo(index + 1)}
            className="absolute right-4 top-1/2 hidden size-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md hover:bg-white md:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <Button
                key={slide.id}
                variant="unstyled"
                type="button"
                aria-label={`Show promotion ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  "h-[10px] rounded-full transition-all",
                  i === index ? "w-[28px] bg-white" : "w-[10px] bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Slide({ slide, priority }: { slide: PromoSlide; priority: boolean }) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden bg-primary md:h-[460px]">
      {slide.imageUrl && (
        <div className="absolute inset-0 md:left-auto md:w-[62%]">
          <Image src={slide.imageUrl} alt="" fill priority={priority} sizes="(min-width: 768px) 62vw, 100vw" className="object-cover" />
        </div>
      )}
      {/* The red wedge the text sits on: a full-bleed wash on a phone, a
          slanted panel on desktop so the dish stays in view. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent md:bg-none"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 hidden w-[52%] bg-primary md:block"
        style={{ clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)" }}
      />
      <div className="relative flex h-full max-w-[1200px] flex-col justify-end gap-3 px-5 pb-12 md:mx-auto md:justify-center md:px-10 md:pb-0">
        <div className="flex max-w-[460px] flex-col gap-3">
          <span className="w-fit rounded-full bg-on-brand-accent px-3 py-1 text-sm font-bold uppercase tracking-[1.2px] text-foreground">
            {slide.eyebrow}
          </span>
          <h2 className="font-display text-5xl uppercase leading-[0.95] text-on-brand md:text-6xl">{slide.title}</h2>
          {slide.body && <p className="line-clamp-3 text-base text-on-brand-muted md:text-lg">{slide.body}</p>}
          <Link
            href={slide.href}
            className="mt-2 inline-flex min-h-[48px] w-fit items-center rounded-full bg-on-brand-accent px-7 text-base font-bold text-foreground shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {slide.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
