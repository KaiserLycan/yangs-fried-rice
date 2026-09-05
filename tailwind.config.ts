import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
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
        rule: "hsl(var(--rule))",
        track: "hsl(var(--track))",
        "field-border": "hsl(var(--field-border))",
        placeholder: "hsl(var(--placeholder))",
        "error-surface": "hsl(var(--error-surface))",
        "error-border": "hsl(var(--error-border))",
      },
      // Loaded via next/font in app/layout.tsx. DM Sans is the body face and
      // Anton is display-only, so it is a separate `font-display` utility
      // rather than an override of the default sans stack.
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        display: ["var(--font-display)", ...fontFamily.sans],
      },
      // Figma `radius` group: 8 / 12 / 16 / 999. ShadCN derives md and sm by
      // subtracting 2px and 4px from --radius, which would give 12/10/8 and
      // miss the design's 16. Mapped literally instead.
      borderRadius: {
        sm: "0.5rem", // radius/8
        md: "var(--radius)", // radius/12
        lg: "1rem", // radius/16
        pill: "9999px", // radius/999
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
