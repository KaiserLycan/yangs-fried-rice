import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandPanel } from "@/components/auth/brand-panel";

export default function NotFound() {
  return (
    <AuthShell brand={<BrandPanel />}>
      <div className="relative flex flex-col px-6 pb-[30px] pt-[30px] md:justify-center md:bg-background md:px-[52px] md:py-[48px]">
        <div className="flex flex-col gap-[14px] rounded-lg bg-background p-5 shadow-sm md:gap-[18px] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <div className="flex flex-col gap-[5px]">
            <h1 className="font-display text-6xl leading-none text-accent md:text-6xl">
              404
            </h1>
            <h2 className="font-display text-2xl leading-tight text-accent md:text-3xl">
              Page Not Found
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The wok is hot, but we can&apos;t find the page you&apos;re looking for. It
              might have been moved or deleted.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-[10px] md:mt-2">
            <Link
              href="/"
              className="flex h-[44px] items-center justify-center rounded-sm bg-accent px-[18px] text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
