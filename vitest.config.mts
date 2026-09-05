import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Upgraded from "node" to "jsdom" to support UI Component testing
    environment: "jsdom",

    globals: true,
    
    // Automatically load testing-library matchers (like .toBeInTheDocument)
    setupFiles: ["./vitest.setup.ts"],
    
    // Added .tsx so Vitest finally sees your frontend tests in __tests__!
    include: ["**/*.test.ts", "**/*.test.tsx"],
    
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});