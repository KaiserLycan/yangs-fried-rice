import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    // The type scale (UI/UX review, docs/user-simulation.md #16): 35 pixel
    // sizes collapsed to these 8 steps. Size only — line height stays with
    // `leading-*` or the inherited 1.5, exactly as the old text-[Npx] classes
    // behaved. Defined here rather than under `extend`, so a size outside the
    // scale (text-xl, text-[13px]) produces no style at all and
    // __tests__/design-scale.test.ts fails on it.
    // Customer screens and the KDS never use `xs` (senior and kitchen staff
    // personas: nothing under 14px); it is for dense back-office tables.
    fontSize: {
      xs: "0.75rem", // 12
      sm: "0.875rem", // 14
      base: "1rem", // 16
      lg: "1.125rem", // 18
      "2xl": "1.5rem", // 24
      "3xl": "1.875rem", // 30
      "5xl": "3rem", // 48
      "6xl": "3.75rem", // 60
    },
    // Figma `radius` group: 8 / 12 / 16 / full. ShadCN derives md and sm by
    // subtracting from --radius, which would miss the design's 16, so the
    // values are literal. Replaces the defaults (the 14 pixel radii that were
    // in use are mapped onto these).
    borderRadius: {
      none: "0",
      sm: "0.5rem", // 8
      md: "var(--radius)", // 12
      lg: "1rem", // 16
      full: "9999px",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          strong: "hsl(var(--muted-strong))",
        },
        card: "hsl(var(--card))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        "on-brand": {
          DEFAULT: "hsl(var(--on-brand))",
          accent: "hsl(var(--on-brand-accent))",
          muted: "hsl(var(--on-brand-muted))",
          subtle: "hsl(var(--on-brand-subtle))",
          rule: "hsl(var(--on-brand-rule))",
        },
        console: "hsl(var(--console))",
        "on-console": {
          muted: "hsl(var(--on-console-muted))",
          subtle: "hsl(var(--on-console-subtle))",
          faint: "hsl(var(--on-console-faint))",
          rule: "hsl(var(--on-console-rule))",
        },
        "on-ink": {
          DEFAULT: "hsl(var(--on-ink))",
          muted: "hsl(var(--on-ink-muted))",
          faint: "hsl(var(--on-ink-faint))",
        },
        timeline: {
          pending: "hsl(var(--timeline-pending))",
          meta: "hsl(var(--timeline-meta))",
        },
        map: {
          surface: "hsl(var(--map-surface))",
          grid: "hsl(var(--map-grid))",
          label: "hsl(var(--map-label))",
          border: "hsl(var(--map-border))",
        },
        rule: "hsl(var(--rule))",
        track: "hsl(var(--track))",
        "field-border": "hsl(var(--field-border))",
        placeholder: "hsl(var(--placeholder))",
        "error-surface": "hsl(var(--error-surface))",
        "error-border": "hsl(var(--error-border))",
        status: {
          received: "hsl(var(--status-received))",
          preparing: "hsl(var(--status-preparing))",
          ready: "hsl(var(--status-ready))",
          done: "hsl(var(--status-done))",
          cancelled: "hsl(var(--status-cancelled))",
        },
        backoffice: "hsl(var(--backoffice))",
        highlight: "hsl(var(--highlight))",
        selected: "hsl(var(--selected))",
        "warning-text": "hsl(var(--warning-text))",
        "warning-surface": "hsl(var(--warning-surface))",
        star: "hsl(var(--star))",
      },
      // Loaded via next/font in app/layout.tsx. DM Sans is the body face and
      // Anton is display-only, so it is a separate `font-display` utility
      // rather than an override of the default sans stack.
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        display: ["var(--font-display)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
