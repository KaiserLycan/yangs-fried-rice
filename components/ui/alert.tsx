import { cn } from "@/lib/utils";

/** Form-level error banner from the error frames. */
export function Alert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-start gap-[10px] rounded-md border border-on-brand-subtle bg-error-surface px-[14px] py-[11px] text-primary",
        className,
      )}
    >
      <span className="text-[14px] font-bold leading-[18.2px]">!</span>
      <p className="text-[13px] leading-[18.2px]">{children}</p>
    </div>
  );
}
