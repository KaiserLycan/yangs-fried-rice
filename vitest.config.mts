import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node environment only. Tests here cover pure logic (cart totals,
    // money math, validation). Rendering components in tests needs jsdom
    // + @testing-library/react — add those when there's a component
    // complex enough to warrant it.
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
