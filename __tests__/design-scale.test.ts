import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The design system, enforced (UI/UX review, docs/user-simulation.md #16).
 *
 * The review counted 697 hard-coded colours, 35 font sizes, 14 radii and 113
 * raw buttons. All of them now come from tokens and the scale in
 * tailwind.config.ts; these checks stop them creeping back one class at a time.
 */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".tsx") ? [path] : [];
  });
}

const FILES = [...walk("components"), ...walk("app")].map((path) => ({
  path: path.replace(/\\/g, "/"),
  // Comments may name old values ("was #E8541F"); only code counts.
  code: readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
    .join("\n"),
}));

function offenders(pattern: RegExp, only?: (path: string) => boolean): string[] {
  return FILES.filter(({ path }) => !only || only(path)).flatMap(({ path, code }) =>
    (code.match(pattern) ?? []).map((hit) => `${path}: ${hit}`),
  );
}

describe("design tokens", () => {
  it("uses no hard-coded colour classes", () => {
    expect(offenders(/[a-z]+-\[#[0-9a-fA-F]{3,8}\]/g)).toEqual([]);
  });

  it("uses only the 8-step type scale", () => {
    expect(offenders(/\btext-\[[0-9.]+(px|rem)\]/g)).toEqual([]);
    expect(offenders(/(?<![\w-])text-(xl|4xl|7xl|8xl|9xl)(?![\w-])/g)).toEqual([]);
  });

  // Senior customer and kitchen staff: nothing under 14px on their screens.
  it("keeps 12px text out of the customer screens and the KDS", () => {
    const backOfficeTable = (path: string) =>
      (path.startsWith("components/manage/") || path.startsWith("app/manage/") || path.startsWith("app/api-docs")) &&
      !path.includes("/kds");
    expect(offenders(/(?<![\w-])text-xs(?![\w-])/g, (path) => !backOfficeTable(path))).toEqual([]);
  });

  it("uses only the radius scale (sm 8 / md 12 / lg 16 / full)", () => {
    // `rounded-[inherit]` takes the parent's radius, which is on the scale.
    expect(offenders(/rounded(-[a-z]+)?-\[(?!inherit\])[^\]]+\]/g)).toEqual([]);
    expect(offenders(/rounded(-(t|b|l|r|tl|tr|bl|br))?-(xl|2xl|3xl|pill)(?![\w-])/g)).toEqual([]);
    expect(offenders(/(?<=["'`\s{])rounded(?=["'`\s}])/g)).toEqual([]);
  });

  it("builds every button on the shared <Button>", () => {
    const primitives = new Set(["components/ui/button.tsx", "components/ui/switch.tsx"]);
    expect(offenders(/<button(?=[\s>])/g, (path) => !primitives.has(path))).toEqual([]);
  });
});
