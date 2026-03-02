import { type Browser, type BrowserContext, type Page } from "@playwright/test";

export interface UserSession {
  username: string;
  context: BrowserContext;
  page: Page;
}

// Respects E2E_APP_URL so Docker / CI / local dev all work without code changes
const BASE_URL = process.env.E2E_APP_URL ?? "http://localhost:4200";

/**
 * Registers a new user via the real registration UI.
 * Returns the session (BrowserContext + Page, already on /dashboard).
 */
export async function registerUser(
  browser: Browser,
  username: string,
  password: string,
): Promise<UserSession> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/register`);
  await page.locator("#reg-username").fill(username);
  await page.locator("#reg-password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 });

  return { username, context, page };
}

/**
 * Logs in an existing user via the real login UI.
 * Returns the session (BrowserContext + Page, already on /dashboard).
 */
export async function loginUser(
  browser: Browser,
  username: string,
  password: string,
): Promise<UserSession> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 });

  return { username, context, page };
}

/**
 * Navigates a logged-in user to the dashboard and joins a room by clicking
 * on its card in the Browse Rooms tab. Waits until the user lands on /room/:id.
 */
export async function joinRoomViaUI(
  session: UserSession,
  roomId: string,
  roomName: string,
): Promise<void> {
  const { page } = session;

  if (!page.url().includes("/dashboard")) {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 });
  }

  // Ensure Browse Rooms tab is active
  await page.getByRole("button", { name: "Browse Rooms" }).click();

  // Click the room card by its aria-label
  await page.getByRole("button", { name: `Join room ${roomName}` }).click();

  await page.waitForURL(`${BASE_URL}/room/${roomId}`, { timeout: 20_000 });
}
