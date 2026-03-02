import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// Override for Docker: E2E_APP_URL=http://localhost:8080 pnpm test
// Override for CI manual start: set in the workflow env block
const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:4200";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // Our multi-user test within a single spec needs serial order
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1, // Single worker: all contexts (users) live in the same test process
  reporter: isCI
    ? [
        ["github"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
      ]
    : [["html", { outputFolder: "playwright-report", open: "on-failure" }]],
  use: {
    baseURL: APP_URL,
    headless: true,
    // Trace / video only captured on failure to keep CI artefacts small
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    // Generous timeout — polling is 1s but Angular SSR/hydration adds a beat
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  timeout: 60_000, // Per-test timeout

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  globalSetup: "./global-setup.ts",
});
