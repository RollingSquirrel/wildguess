/**
 * Global setup: waits for both the API and Angular/nginx frontend to be ready,
 * then resets the database via the test reset endpoint (if enabled).
 *
 * Environment variables (all optional):
 *   E2E_APP_URL          — Frontend base URL  (default: http://localhost:4200)
 *   E2E_API_URL          — API base URL       (default: http://localhost:3000)
 *   ENABLE_TEST_ROUTES   — Must be "true" on the API server for reset to work
 *
 * Docker quick-start example:
 *   E2E_APP_URL=http://localhost:8080 E2E_API_URL=http://localhost:8080 pnpm test
 *   (nginx proxies /api/* so health + reset are at $E2E_API_URL/api/...)
 */
async function globalSetup(): Promise<void> {
  const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:4200";
  const API_URL = process.env.E2E_API_URL ?? "http://localhost:3000";

  const HEALTH_URL = `${API_URL}/api/health`;
  const RESET_URL = `${API_URL}/api/test/reset-db`;
  const TIMEOUT_MS = 60_000;
  const POLL_INTERVAL_MS = 1_000;

  async function waitFor(url: string): Promise<void> {
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
        if (res.ok) {
          console.log(`[global-setup] ✓ ${url} is ready`);
          return;
        }
      } catch {
        // Not ready yet — keep polling
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    throw new Error(
      `[global-setup] Timed out waiting for ${url} to become ready`,
    );
  }

  await Promise.all([waitFor(HEALTH_URL), waitFor(APP_URL)]);

  // Reset DB so each test run starts from a clean state
  const resetRes = await fetch(RESET_URL, { method: "POST" });
  if (!resetRes.ok) {
    throw new Error(
      `[global-setup] DB reset failed (${resetRes.status}). ` +
        `Is ENABLE_TEST_ROUTES=true set on the API server?`,
    );
  }
  console.log("[global-setup] ✓ Database reset");
}

export default globalSetup;
