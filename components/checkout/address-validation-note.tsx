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
  | { status: "valid"; estimated: boolean }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

/** The states a parent form can react to — e.g. to disable its Save button. */
export type AddressValidationStatus = ValidationState["status"];

type ValidateResponse = {
  valid?: boolean;
  message?: string;
  /** "estimate" = the map couldn't be used, so the address was accepted by city. */
  source?: "geocoder" | "estimate" | null;
  /** What the route returns on a 400 — a schema complaint about the address
   *  itself, not a failure of the service. */
  error?: string;
};

export function AddressValidationNote({
  address,
  onStatusChange,
}: {
  address: string;
  /**
   * Reports each state change. A form uses `"invalid"` to disable its submit
   * button, so an address that is too far away (or that the map can't find)
   * can't be saved in the first place rather than being refused afterwards.
   */
  onStatusChange?: (status: AddressValidationStatus) => void;
}) {
  const [state, setState] = React.useState<ValidationState>({
    status: "checking",
  });

  const notify = React.useRef(onStatusChange);
  notify.current = onStatusChange;
  React.useEffect(() => {
    notify.current?.(state.status);
  }, [state.status]);

  React.useEffect(() => {
    let stale = false;

    const timer = setTimeout(async () => {
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
          setState({
            status: "invalid",
            message:
              result.error ?? "This address can't be checked as written.",
          });
          return;
        }

        setState(
          result.valid
            ? { status: "valid", estimated: result.source === "estimate" }
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
        if (!stale) setState({ status: "unavailable" });
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
      return state.estimated
        ? "Address accepted. We couldn't confirm the exact spot on the map, so delivery is estimated by city."
        : "Address validated against mapping service.";
    case "invalid":
      return state.message;
    case "unavailable":
      return "We couldn't reach the mapping service to check this address.";
  }
}
