import { cn } from "@/lib/utils";

/**
 * Label + control + error message, the shape every field on the auth screens
 * takes. `action` is the trailing slot the password field uses for its
 * "Show" toggle, which sits on the label row rather than inside the input.
 */
export function Field({
  label,
  htmlFor,
  action,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  action?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex w-full flex-col gap-[5px] md:gap-[6px]", className)}
    >
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground md:tracking-[1.32px]"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? <p className="text-[12px] text-primary">{error}</p> : null}
    </div>
  );
}
