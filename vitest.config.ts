import { defineConfig } from "vitest/config";

// Separate from vite.config.ts, which requires INPUT and is only for bundling the card.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
