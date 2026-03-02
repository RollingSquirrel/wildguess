import { test, expect, type Browser } from "@playwright/test";
import { registerUser, joinRoomViaUI, type UserSession } from "./helpers/user";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PASSWORD = "testpass123";
// Unique suffix per run to avoid username/room collisions across repeated local runs
const RUN_ID = Date.now().toString(36);
const ROOM_NAME = `E2E Test Room ${RUN_ID}`;
const USERS = [
  { username: `e2e_host_${RUN_ID}`, isHost: true },
  { username: `e2e_u2_${RUN_ID}`, isHost: false },
  { username: `e2e_u3_${RUN_ID}`, isHost: false },
  { username: `e2e_u4_${RUN_ID}`, isHost: false },
  { username: `e2e_u5_${RUN_ID}`, isHost: false },
  { username: `e2e_u6_${RUN_ID}`, isHost: false },
];
// Votes for round 1 — intentionally divergent so versus mode triggers
const ROUND1_VOTES = ["5", "1", "13", "3", "8", "2"];
// Votes for round 2 — all the same (consensus)
const ROUND2_VOTES = Array(6).fill("5");

// ---------------------------------------------------------------------------
// Shared state (populated in beforeAll, consumed across tests)
// ---------------------------------------------------------------------------
let sessions: UserSession[] = [];
let roomId = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Waits for the room's phase badge to contain the given phase text.
 * Uses the host's page because we're driving the host through the UI.
 */
async function waitForPhase(
  hostPage: UserSession["page"],
  phase: "voting" | "revealed" | "versus",
): Promise<void> {
  await expect(hostPage.locator('[data-cy="phase-badge"]')).toContainText(
    phase,
    {
      timeout: 10_000,
    },
  );
}

/**
 * Waits for the member sidebar to show N members with the ✓ Voted indicator.
 */
async function waitForAllVoted(
  hostPage: UserSession["page"],
  expectedCount: number,
): Promise<void> {
  await expect(hostPage.locator('[data-cy="member-voted"]')).toHaveCount(
    expectedCount,
    {
      timeout: 20_000,
    },
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Planning Poker — multi-user voting", () => {
  // We need the browser object to create multiple independent contexts
  let browser: Browser;

  test.beforeAll(async ({ browser: b }: { browser: Browser }) => {
    browser = b;

    // 1. Register all 6 users — each gets their own BrowserContext + Page
    sessions = await Promise.all(
      USERS.map(({ username }) => registerUser(browser, username, PASSWORD)),
    );

    // 2. Host creates the room via the UI
    const hostPage = sessions[0].page;
    await hostPage.getByRole("button", { name: "+ Create Room" }).click();
    await hostPage.locator("#create-room-name").fill(ROOM_NAME);
    await hostPage.locator('button[type="submit"]').click();

    // 3. Wait for the host to land on the room page and capture the room ID from the URL
    await hostPage.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 20_000 });
    roomId = hostPage.url().split("/room/")[1];

    // 4. Users 2–6 join via the Browse Rooms UI (in parallel)
    await Promise.all(
      sessions
        .slice(1)
        .map((session) => joinRoomViaUI(session, roomId, ROOM_NAME)),
    );

    // 5. Wait for all 6 to appear in the host's member sidebar
    await expect(
      sessions[0].page.locator('[data-cy="member-item"]'),
    ).toHaveCount(6, {
      timeout: 20_000,
    });
  });

  test.afterAll(async () => {
    // Close all contexts to release resources
    await Promise.all(sessions.map((s) => s.context.close()));
  });

  // -------------------------------------------------------------------------
  // Round 1 — divergent votes → versus mode
  // -------------------------------------------------------------------------
  test("Round 1: all users vote, host reveals, versus mode, next round", async () => {
    const hostPage = sessions[0].page;

    // Verify we are in the voting phase
    await waitForPhase(hostPage, "voting");

    // All 6 users cast their votes simultaneously (each on their own page)
    await Promise.all(
      sessions.map((session, i) =>
        session.page
          .locator(`[data-cy="vote-card"][data-value="${ROUND1_VOTES[i]}"]`)
          .click(),
      ),
    );

    // Wait for all votes to register (sidebar shows 6 voted indicators)
    await waitForAllVoted(hostPage, 6);

    // Host reveals votes
    await hostPage.locator('[data-cy="reveal-btn"]').click();
    await waitForPhase(hostPage, "revealed");

    // Verify results: all 6 members appear in the results table with votes visible
    const resultRows = hostPage.locator('[data-cy="result-member-row"]');
    await expect(resultRows).toHaveCount(6, { timeout: 10_000 });

    // Verify stats panel shows avg, median, min, max
    await expect(hostPage.locator('[data-cy="stats-avg"]')).toBeVisible();
    await expect(hostPage.locator('[data-cy="stats-min"]')).toBeVisible();
    await expect(hostPage.locator('[data-cy="stats-max"]')).toBeVisible();

    // Host triggers versus mode
    await hostPage.locator('[data-cy="versus-btn"]').click();
    await waitForPhase(hostPage, "versus");

    // Verify versus section shows two fighter cards (votes are different so not consensus)
    await expect(hostPage.locator('[data-cy="versus-section"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      hostPage.locator('[data-cy="consensus-msg"]'),
    ).not.toBeVisible();

    // Wait for non-host pages to also show "versus" phase via polling
    await Promise.all(
      sessions.slice(1).map((session) =>
        expect(session.page.locator('[data-cy="phase-badge"]')).toContainText(
          "versus",
          {
            timeout: 10_000,
          },
        ),
      ),
    );

    // Host starts next round
    await hostPage.locator('[data-cy="next-round-btn"]').click();
    await waitForPhase(hostPage, "voting");

    // Round counter should now show "Round 2" on all pages
    await Promise.all(
      sessions.map((session) =>
        expect(
          session.page.locator('[data-cy="round-indicator"]'),
        ).toContainText("Round 2", {
          timeout: 10_000,
        }),
      ),
    );
  });

  // -------------------------------------------------------------------------
  // Round 2 — unanimous vote → consensus message
  // -------------------------------------------------------------------------
  test("Round 2: unanimous votes → consensus reached", async () => {
    const hostPage = sessions[0].page;

    await waitForPhase(hostPage, "voting");

    // All 6 users vote "5"
    await Promise.all(
      sessions.map((session) =>
        session.page.locator('[data-cy="vote-card"][data-value="5"]').click(),
      ),
    );

    await waitForAllVoted(hostPage, 6);

    await hostPage.locator('[data-cy="reveal-btn"]').click();
    await waitForPhase(hostPage, "revealed");

    // Go straight to versus to check consensus message
    await hostPage.locator('[data-cy="versus-btn"]').click();
    await waitForPhase(hostPage, "versus");

    // All votes are the same → consensus reached, no VS fighters
    await expect(hostPage.locator('[data-cy="consensus-msg"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      hostPage.locator('[data-cy="versus-section"]'),
    ).not.toBeVisible();
  });
});
