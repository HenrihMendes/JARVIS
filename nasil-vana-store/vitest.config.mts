import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    env: {
      DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
      APP_SECRET: "test-secret-test-secret-test-secret-123",
      SITE_URL: "https://www.exemplo.com.br",
      MP_ACCESS_TOKEN: "TEST-unit",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/empty.ts"),
    },
  },
});
