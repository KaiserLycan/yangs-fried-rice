import Image from "next/image";

/**
 * The dark side of the employee login screens.
 *
 * Not a variant of BrandPanel. The wordmark, headline, palette and footer all
 * differ, and this panel carries a labelled three-stat block where the
 * customer one carries two unlabelled stats. See EmployeeAuthShell for why the
 * duplication is deliberate and short-lived.
 *
 * Mobile shows the wordmark, headline and one line of copy; desktop adds a
 * second line above it and the stats. The copy genuinely differs between the
 * frames, so both strings are rendered and toggled rather than one being
 * truncated.
 */
export function EmployeeBrandPanel() {
  return (
    <div className="relative flex flex-col px-6 pt-[26px] md:bg-console md:px-[44px] md:py-[46px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
      >
        <Image
          src="/images/employee-console-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-10"
        />
      </div>

      <p className="relative font-display text-[20px] tracking-[0.8px] text-on-brand md:text-[22px] md:tracking-[0.88px]">
        YANG&apos;S <span className="text-accent">EMPLOYEE CONSOLE</span>
      </p>

      <div className="relative flex flex-col gap-3 pt-[19px] md:mb-9 md:gap-[18px] md:pt-[262px]">
        <h1 className="font-display text-[40px] leading-[38.4px] text-on-brand md:text-[56px] md:leading-[53.76px]">
          RUN THE
          <br />
          SERVICE FROM
          <br />
          <span className="text-accent">ONE SCREEN.</span>
        </h1>
        <p className="max-w-[360px] text-[13px] leading-[19.5px] text-on-console-muted md:text-[15px] md:leading-[22.5px]">
          {/* COPY: "Manager and owner accounts only" names two roles that do
              not exist — the confirmed user types are Customer, Business
              Owner, Staff and Rider. Ported as drawn; flagged for the PM. */}
          <span className="hidden md:block">
            Menu, live orders, rider assignment and daily sales.
          </span>
          Manager and owner accounts only.
        </p>
      </div>

      {/* The auto top margin keeps surplus height out of the middle of the
          panel: it absorbs every leftover pixel in the column, so on a window
          taller than the drawn 740px the extra space opens up here rather than
          pooling in the wordmark-to-headline gap. That gap is the one the
          frame fixes at 262px, so it must not move. The designed 36px above
          the rule is padding rather than a margin precisely so the auto margin
          cannot swallow it — this is the same defect ticket 02 fixed on the
          customer panel, avoided here rather than repeated. */}
      <div className="relative hidden md:mt-auto md:block md:pt-[36px]">
        <div className="flex flex-col gap-2 border-t border-on-console-rule pt-5">
          <p className="text-[11px] uppercase tracking-[1.76px] text-on-console-faint">
            Today at Yang&apos;s
          </p>
          {/* Drawn as a 26px gap, which is the Figma `space/26` step. That step
              is being retired in favour of 24 so the spacing group lands on
              Tailwind's own scale — see the token notes in globals.css. */}
          <div className="flex gap-6">
            <Stat value="37" label="Orders" />
            <Stat value="6" label="Staff on shift" />
            <Stat value="2" label="Riders online" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <p className="font-display text-[24px] text-accent">{value}</p>
      <p className="text-[11px] text-on-console-subtle">{label}</p>
    </div>
  );
}
