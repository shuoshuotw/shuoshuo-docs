import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const API = "https://api.shuoshuotw.xyz";
const CORE = "http://localhost:3001";
const SUPABASE = "http://127.0.0.1:54321";

function secretKey() {
  if (process.env.SUPABASE_SECRET_KEY) return process.env.SUPABASE_SECRET_KEY;
  const file = "../shuoshuo-core/.env.local";
  const line = existsSync(file) ? readFileSync(file, "utf8").match(/^SUPABASE_SECRET_KEY=(.+)$/m) : null;
  if (!line?.[1]) throw new Error("SUPABASE_SECRET_KEY is not set");
  return line[1].trim();
}

/** The docs talk to the real host name; here that host is the local Core. */
async function pointApiAtCore(page: Page) {
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const headers = { ...request.headers(), origin: "https://docs.shuoshuotw.xyz" };
    const response = await fetch(request.url().replace(API, CORE), { method: request.method(), headers, ...(request.postData() ? { body: request.postData()! } : {}) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
  });
}

/** The curl commands on a page, exactly as a reader would copy them. */
async function curlCommands(page: Page) {
  const blocks = await page.locator("pre").allInnerTexts();
  return blocks.map((text) => text.trim()).filter((text) => text.startsWith("curl "));
}

const runCurl = (command: string, env: Record<string, string> = {}) => {
  const rewritten = command.replaceAll(API, CORE).replace('"$SHUOSHUO_API_KEY"', "$SHUOSHUO_API_KEY");
  return execFileSync("bash", ["-c", `${rewritten} -s -w '\\n%{http_code}'`], { encoding: "utf8", env: { ...process.env, ...env } });
};

async function newApiKey() {
  const secret = secretKey();
  const email = `${randomUUID()}@example.com`;
  const password = randomUUID();
  const created = await fetch(`${SUPABASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: `文件${randomUUID().slice(0, 8)}` } }),
  });
  expect(created.status).toBe(200);
  const session = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const { access_token: token } = (await session.json()) as { access_token: string };
  const key = await fetch(`${CORE}/v1/me/api-keys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "文件測試" }),
  });
  expect(key.status).toBe(201);
  return ((await key.json()) as { data: { secret: string } }).data.secret;
}

test.describe("E2E-09: the docs match the API", () => {
  test("the home page's commands work, and running one here shows a quote", async ({ page }) => {
    await pointApiAtCore(page);
    await page.goto("/");
    const commands = await curlCommands(page);
    expect(commands.length).toBeGreaterThanOrEqual(3);
    for (const command of commands) expect(runCurl(command).trim().endsWith("200"), command).toBe(true);

    await page.getByRole("button", { name: "在這裡執行" }).click();
    await expect(page.locator(".try-output")).not.toBeEmpty();
    await expect(page.getByRole("button", { name: "再抽一句" })).toBeVisible();
  });

  test("the quickstart's commands work, with and without a key", async ({ page }) => {
    await page.goto("/quickstart");
    const commands = await curlCommands(page);
    expect(commands.length).toBeGreaterThanOrEqual(2);
    const key = await newApiKey();
    for (const command of commands) expect(runCurl(command, { SHUOSHUO_API_KEY: key }).trim().endsWith("200"), command).toBe(true);
    // A key the API rejected would have failed above; this one proves the variable is used at all
    expect(runCurl(commands.find((command) => command.includes("Authorization"))!, { SHUOSHUO_API_KEY: "shuoshuo_test_nope_nope" }).trim().endsWith("401")).toBe(true);
  });

  test("the Playground sends a request and shows the answer", async ({ page }) => {
    await pointApiAtCore(page);
    await page.goto("/api/getRandomQuote");
    await page.getByRole("button", { name: "在 Playground 試用" }).click();
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.getByRole("button", { name: "送出" }).click();
    await expect.poll(() => requests.some((url) => url.startsWith(`${API}/v1/quotes/random`))).toBe(true);
    await expect(page.getByRole("dialog").getByText("request_id").first()).toBeVisible();
  });

  test("§14.1: personal endpoints have no Send button and say why; writes warn", async ({ page }) => {
    await page.goto("/api/getMe");
    await expect(page.getByText("無法在文檔站試用")).toBeVisible();
    await expect(page.getByRole("button", { name: "在 Playground 試用" })).toHaveCount(0);

    await page.goto("/api/createQuote");
    await expect(page.getByText("會動到真實資料")).toBeVisible();
    await expect(page.getByRole("button", { name: "在 Playground 試用" })).toBeVisible();
  });

  test("every error Core can send has its anchor, as docs_url promises", async ({ page }) => {
    const missing = await fetch(`${CORE}/v1/quotes/not-a-uuid`);
    const { error } = (await missing.json()) as { error: { code: string; docs_url: string } };
    expect(error.docs_url).toBe(`https://docs.shuoshuotw.xyz/errors#${error.code}`);

    await page.goto(`/errors#${error.code}`);
    await expect(page.locator(`[id="${error.code}"]`)).toBeVisible();
    await expect(page.locator(`[id="${error.code}"]`)).toBeInViewport();

    const codes = [...readFileSync("openapi/errors.yaml", "utf8").matchAll(/^([A-Z][A-Z_]+):$/gm)].map((match) => match[1]!);
    expect(codes.length).toBeGreaterThan(50);
    for (const code of codes) await expect(page.locator(`[id="${code}"]`), code).toHaveCount(1);
  });

  test("search finds Chinese text in the static index", async ({ page }) => {
    await page.goto("/");
    await page.locator("button[data-search-full]:visible").first().click();
    await page.getByPlaceholder("搜尋", { exact: true }).fill("跳脫");
    await expect(page.getByRole("dialog").getByText("安全").first()).toBeVisible();
  });

  test("the interface is in Traditional Chinese", async ({ page }) => {
    await page.goto("/quickstart");
    await expect(page.getByText("本頁內容").first()).toBeVisible();
    expect(await page.locator("html").getAttribute("lang")).toBe("zh-Hant-TW");
  });

  test("UI-12: the docs say 說說, never 語錄", async ({ page }) => {
    for (const path of ["/", "/quickstart", "/security", "/errors", "/migrate-from-hitokoto"]) {
      await page.goto(path);
      expect(await page.locator("body").innerText(), path).not.toContain("語錄");
    }
  });
});
