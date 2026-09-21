"use client";

import * as React from "react";

/**
 * The line under the address, "Address validated against mapping service."
 * (`133:1104`).
 *
 * The frame states it as a fact, so this checks that it is one rather than
 * printing the claim unconditionally. `POST /api/address/validate` already
 * exists — LleytonFlores built it for issue #4 (US-10), geocoding through
 * Nominatim with a text-shaped fallback when that is unreachable. It is a
 * lookup, not a mutation, so calling it is frontend work under the same
 * reads-versus-writes line every other screen in this flow follows.
 *
 * Four states, because the request has four honest outcomes: still checking,
 * validated, the service says it cannot find the address, and the check
 * itself failed. The last two say so plainly instead of falling back to the
 * frame's confident wording — an address the mapping service has never heard
 * of is exactly what a customer needs told before a rider is sent to it.
 */

type ValidationState =
  | { status: "checking" }
  | { status: "valid" }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

type ValidateResponse = {
  valid?: boolean;
  message?: string;
  /** What the route returns on a 400 — a schema complaint about the address
   *  itself, not a failure of the service. */
  error?: string;
};

export function AddressValidationNote({
  address,
  onStateChange,
}: {
  address: string;
  onStateChange?: (state: ValidationState) => void;
}) {
  const [state, setState] = React.useState<ValidationState>({
    status: "checking",
  });

  React.useEffect(() => {
    let stale = false;

    const handleState = (next: ValidationState) => {
      if (!stale) {
        setState(next);
        onStateChange?.(next);
      }
    };

    const timer = setTimeout(async () => {
      if (!address.trim()) {
        handleState({ status: "invalid", message: "Add a complete delivery address to continue." });
        return;
      }

      try {
        const response = await fetch("/api/address/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        // A 4xx is the route rejecting the address, not the service being
        // down: `addressSchema` returns 400 with an `error` for an address
        // that is too short or too long. Treating that as an outage would
        // tell a customer with an unusable stored address that everything is
        // fine except our connection — the exact confusion the four states
        // below exist to prevent. Only 5xx and network failures are outages.
        if (response.status >= 500) throw new Error(`HTTP ${response.status}`);

        const result = (await response.json()) as ValidateResponse;
        if (stale) return;

        if (!response.ok) {
          handleState({
            status: "invalid",
            message:
              result.error ?? "This address can't be checked as written.",
          });
          return;
        }

        handleState(
          result.valid
            ? { status: "valid" }
            : {
                status: "invalid",
                message:
                  result.message ??
                  "We couldn't find this address on the map. Please check it.",
              },
        );
      } catch {
        // The service being down is not the customer's address being wrong,
        // so this says the check didn't happen rather than blaming the
        // address or claiming a validation that never ran.
        if (!stale) handleState({ status: "unavailable" });
      }
    }, 500);

    setState({ status: "checking" });

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [address]);

  return (
    <p
      aria-live="polite"
      className={
        state.status === "invalid"
          ? "text-[12px] text-destructive"
          : "text-[12px] text-muted-foreground"
      }
    >
      {noteFor(state)}
    </p>
  );
}

function noteFor(state: ValidationState): string {
  switch (state.status) {
    case "checking":
      return "Checking this address against the mapping service…";
    case "valid":
      return "Address validated against mapping service.";
    case "invalid":
      return state.message;
    case "unavailable":
      return "We couldn't reach the mapping service to check this address.";
  }
}
