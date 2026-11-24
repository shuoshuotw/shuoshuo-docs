import { defineConfig, devices } from "@playwright/test";

// E2E-09. Needs `supabase start` and Core on port 5001: the examples and the Playground really run.
export default defineConfig({
  testDir: "tests",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5003",
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" }),
  },
  webServer: { command: "node scripts/serve-out.mjs", url: "http://localhost:5003", reuseExistingServer: true },
});
