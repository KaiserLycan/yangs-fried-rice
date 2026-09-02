import Image from "next/image";

/**
 * Responsive shell for the auth screens.
 *
 * The two Figma frames are different compositions, not one layout reflowed:
 * on mobile the dragon covers the whole page and the form sits in a cream
 * card floating on top of it, while on desktop the screen splits into two
 * full-height columns with the dragon confined to the left one. That is why
 * the background image is painted twice — once here for the mobile page and
 * once inside BrandPanel for the desktop column — rather than moved around
 * with a single element.
 *
 * Both frames carry a rounded corner and a drop shadow in Figma. Those are
 * artboard presentation, not app chrome, so neither is reproduced: this
 * screen is full-bleed at every width.
 */
export function AuthShell({
  brand,
  children,
}: {
  brand: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-primary md:grid md:grid-cols-[1.05fr_1fr]">
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
  );
}
