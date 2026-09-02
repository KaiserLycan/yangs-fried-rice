import Image from "next/image";

/**
 * Responsive shell for the auth screens.
 *
 * The two Figma frames are different compositions, not one layout reflowed:
 * on mobile the dragon covers the whole page and the form sits in a cream
 * card floating on top of it, while on desktop the whole thing becomes a
 * two-column card with the dragon confined to the left column. That is why
 * the background image is painted twice — once here for the mobile page and
 * once inside BrandPanel for the desktop column — rather than moved around
 * with a single element.
 *
 * The dark surround in the Figma screenshot is the canvas, not the design:
 * the card's shadow is only 16% alpha and would be invisible on it, so the
 * desktop page uses the cream background token.
 */
export function AuthShell({
  brand,
  children,
}: {
  brand: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-primary md:flex md:items-center md:justify-center md:bg-background md:p-6">
      <div className="relative flex min-h-screen flex-col md:grid md:min-h-[760px] md:w-full md:max-w-[1280px] md:grid-cols-[1.05fr_1fr] md:overflow-hidden md:rounded-[20px] md:shadow-[0_24px_60px_0_rgba(26,18,16,0.16)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden md:hidden"
        >
          <Image
            src="/images/login-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-150 object-cover opacity-20"
          />
        </div>
        {brand}
        {children}
      </div>
    </div>
  );
}
