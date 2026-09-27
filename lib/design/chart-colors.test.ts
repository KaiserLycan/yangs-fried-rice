import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CHART_COLORS, CHART_TOKENS } from "./chart-colors";

const css = readFileSync("app/globals.css", "utf8");

function tokenRgb(name: string): number[] {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)\\s+(\\d+)%\\s+(\\d+)%`));
  if (!m) throw new Error(`no --${name} in globals.css`);
  const [h, s, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

function rgb(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

describe("chart colours are the design tokens", () => {
  it.each(Object.keys(CHART_COLORS) as (keyof typeof CHART_COLORS)[])("%s", (key) => {
    const [r, g, b] = rgb(CHART_COLORS[key]);
    const [tr, tg, tb] = tokenRgb(CHART_TOKENS[key]);
    // HSL in globals.css is rounded to whole numbers: allow a couple of steps.
    expect(Math.abs(r - tr)).toBeLessThanOrEqual(3);
    expect(Math.abs(g - tg)).toBeLessThanOrEqual(3);
    expect(Math.abs(b - tb)).toBeLessThanOrEqual(3);
  });
});
