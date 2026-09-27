import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * `supabase.rpc` reads the client through `this`. Taken off the client —
 * `const rpc = supabase.rpc as …` to widen its types — it has none, and the
 * first call throws "Cannot read properties of undefined (reading 'rest')".
 * That shipped once (Cash remitted and the CSV export both 500'd), and no
 * unit test noticed because they mock the client. Widen the type of
 * `supabase.rpc.bind(supabase)` instead.
 */
const ROOTS = ["app", "components", "lib", "hooks"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

function sourceFiles(path: string): string[] {
  const stats = statSync(path);
  if (stats.isFile()) return /\.(ts|tsx)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((entry) =>
    SKIP_DIRS.has(entry) ? [] : sourceFiles(join(path, entry)),
  );
}

describe("supabase.rpc is never used detached from its client", () => {
  const files = ROOTS.flatMap(sourceFiles).filter((file) => !/\.test\.(ts|tsx)$/.test(file));

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("never assigns or casts an unbound .rpc", () => {
    // `= supabase.rpc as`, `= supabase.rpc;`, `{ rpc } = supabase`
    const detached = /=\s*\w+\.rpc\s*(as\b|;)|\{\s*rpc\s*\}\s*=\s*\w+/;
    const offenders = files.filter((file) => detached.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
