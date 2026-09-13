import Image from "next/image";

/**
 * Responsive shell for the employee login screens.
 *
 * Structurally the twin of AuthShell, but deliberately its own file. The
 * employee console is a second brand rather than a dark skin of the customer
 * one: different surface, different artwork, and the column ratio is reversed
 * — the form side is the wider of the two here, where on the customer screens
 * the brand side is. Ticket 05 pulls the shared shape out once both screens
 * exist to compare against each other; guessing at it from a single example
 * is what that ticket exists to avoid.
 *
 * As on the customer screens, the frame's own 18px radius and drop shadow are
 * artboard presentation rather than app chrome, so this is full-bleed at every
 * width. The mobile frame's status bar is device chrome and is skipped for the
 * same reason.
 */
export function EmployeeAuthShell({
  brand,
  children,
}: {
  brand: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-console md:grid md:grid-cols-[1fr_1.05fr]">
      {/* Mobile paints the artwork across the whole page; desktop confines it
          to the brand column, so EmployeeBrandPanel paints its own copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden md:hidden"
      >
        <Image
          src="/images/employee-console-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.05]"
        />
      </div>
      {brand}
      {children}
    </div>
  );
}
