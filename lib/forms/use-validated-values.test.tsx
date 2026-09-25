import { describe, expect, it } from "vitest";
import * as React from "react";
import { render, act } from "@testing-library/react";
import { z } from "zod";
import { useValidatedValues } from "./use-live-validation";

/**
 * A caller that mirrors a prop into the hook's server-error state — exactly
 * what the employee modal does:
 *
 *     useEffect(() => { setServerErrors(serverErrors); },
 *               [serverErrors, setServerErrors]);
 *
 * If `setServerErrors` is a fresh function on every render, this effect
 * re-fires on every render and React aborts with "Maximum update depth
 * exceeded". The symptom is not a crash: the page paints, but the render
 * loop pegs the main thread, so nothing on the screen responds to a click —
 * including navigation belonging to other components entirely.
 */
const schema = z.object({ name: z.string().min(2) });

function Mirror({
  serverErrors,
  onRender,
}: {
  serverErrors: Record<string, string> | null;
  onRender: () => void;
}) {
  const form = useValidatedValues(schema, { name: "ok" });
  const { setServerErrors } = form;

  onRender();

  React.useEffect(() => {
    setServerErrors(serverErrors);
  }, [serverErrors, setServerErrors]);

  return <span>{Object.keys(form.errors).length}</span>;
}

describe("useValidatedValues stability", () => {
  it("does not re-render forever when a caller mirrors a prop in", () => {
    let renders = 0;
    render(<Mirror serverErrors={null} onRender={() => renders++} />);

    // The loop this guards produced thousands. A couple of passes is normal;
    // anything near double figures means the dependency is unstable again.
    expect(renders).toBeLessThan(10);
  });

  it("keeps setServerErrors and attemptSubmit stable across renders", () => {
    const seen: { set: unknown[]; submit: unknown[] } = { set: [], submit: [] };

    function Probe({ tick }: { tick: number }) {
      const form = useValidatedValues(schema, { name: "ok" });
      seen.set.push(form.setServerErrors);
      seen.submit.push(form.attemptSubmit);
      return <span>{tick}</span>;
    }

    const { rerender } = render(<Probe tick={0} />);
    rerender(<Probe tick={1} />);
    rerender(<Probe tick={2} />);

    expect(new Set(seen.set).size).toBe(1);
    expect(new Set(seen.submit).size).toBe(1);
  });

  it("treats setting empty errors twice as no change", () => {
    let renders = 0;
    let setter: ((next: Record<string, string> | null) => void) | null = null;

    function Probe() {
      const form = useValidatedValues(schema, { name: "ok" });
      setter = form.setServerErrors;
      renders++;
      return null;
    }

    render(<Probe />);
    const before = renders;

    // `next ?? {}` used to hand back a brand new object every time, so even a
    // stable function re-rendered every consumer that passes null.
    act(() => setter?.(null));
    act(() => setter?.({}));

    expect(renders).toBe(before);
  });
});
