import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";
import { Browser, BrowserContext, chromium, Page } from "playwright";

const SESSIONS_DIR = join(process.cwd(), ".sessions");

/**
 * Generate a safe directory name from a URL
 * Uses the domain name and creates a hash-like identifier
 */
const getSessionDir = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Use domain name and create a safe directory name
    const domain = urlObj.hostname.replace(/\./g, "_");
    // Add a hash of the full URL to handle different paths/subdomains
    const urlHash = Buffer.from(url)
      .toString("base64")
      .replace(/[/+=]/g, "")
      .substring(0, 16);
    return join(SESSIONS_DIR, `${domain}_${urlHash}`);
  } catch {
    // Fallback if URL parsing fails
    const safeName = url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    return join(SESSIONS_DIR, safeName);
  }
};

/**
 * Ensure sessions directory exists
 */
const ensureSessionsDir = async (): Promise<void> => {
  if (!existsSync(SESSIONS_DIR)) {
    await mkdir(SESSIONS_DIR, { recursive: true });
  }
};

/**
 * Create a persistent browser context that saves cookies and localStorage
 * This allows sessions to persist between runs
 */
export const createPersistentContext = async (
  url: string
): Promise<BrowserContext> => {
  await ensureSessionsDir();
  const userDataDir = getSessionDir(url);

  // Create persistent context - this will save cookies, localStorage, etc.
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: null, // Use full screen size
    // Optional: you can add viewport, user agent, etc. here
  });

  return context;
};

/**
 * Legacy function for backward compatibility
 * Creates a non-persistent browser (not recommended for session persistence)
 */
export const createBrowser = async (): Promise<Browser> => {
  const browser = await chromium.launch({
    headless: false,
  });
  return browser;
};

export const navigateToUrl = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: "networkidle" });
};
