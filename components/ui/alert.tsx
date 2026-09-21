import { cn } from "@/lib/utils";

/** Form-level banner for error or success states. */
export function Alert({
  children,
  className,
  tone = "error",
  role = "alert",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "error" | "success";
  role?: "alert" | "status";
}) {
  const isSuccess = tone === "success";

  return (
    <div
      role={role}
      className={cn(
        "flex w-full items-start gap-[10px] rounded-md border px-[14px] py-[11px]",
        isSuccess
          ? "border-green-700/30 bg-green-50 text-green-800"
          : "border-error-border bg-error-surface text-error-border",
        className,
      )}
    >
      <span className="text-[14px] font-bold leading-[18.2px]">
        {isSuccess ? "✓" : "!"}
      </span>
      <p className="text-[13px] leading-[18.2px]">{children}</p>
    </div>
  );
}
