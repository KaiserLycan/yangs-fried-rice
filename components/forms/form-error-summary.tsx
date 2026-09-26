"use client";

import { Alert } from "@/components/ui/alert";
import type { FieldErrors } from "@/lib/validation/field-errors";

/**
 * The banner shown when a submission is rejected by the server: the overall
 * reason, then each field that caused it — "Email: An account with this email
 * already exists." — as a link that jumps to and focuses that input. The same
 * messages also appear under the fields themselves; this is where someone
 * looking at the top of a long form finds out where to scroll.
 */
export function FormErrorSummary({
  message,
  fieldErrors,
  labels,
  idPrefix = "",
}: {
  message: string | null | undefined;
  fieldErrors?: FieldErrors | null;
  /** Field name → the label printed on the form. */
  labels: Record<string, string>;
  /** Prepended to the field name to find the input's id (e.g. "address-"). */
  idPrefix?: string;
}) {
  if (!message) return null;
  const entries = Object.entries(fieldErrors ?? {});

  return (
    <Alert>
      <div className="flex flex-col gap-[4px]">
        <span className="font-bold">{message}</span>
        {entries.length > 0 ? (
          <ul className="flex flex-col gap-[2px] text-[12.5px]">
            {entries.map(([field, error]) => (
              <li key={field}>
                <a
                  href={`#${idPrefix}${field}`}
                  onClick={(event) => {
                    const target = document.getElementById(`${idPrefix}${field}`);
                    if (!target) return;
                    event.preventDefault();
                    target.focus();
                    target.scrollIntoView({ block: "center", behavior: "smooth" });
                  }}
                  className="underline underline-offset-2"
                >
                  {labels[field] ?? field}
                </a>
                : {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Alert>
  );
}
