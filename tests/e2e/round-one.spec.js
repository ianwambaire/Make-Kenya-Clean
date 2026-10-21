import { expect, test } from "@playwright/test";

const codePattern = /^MKC-\d{4}-[A-Z0-9]+$/;
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

test.beforeEach(async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const post = route.request().method() === "POST";
    const reports = new URL(route.request().url()).pathname.endsWith("/public_reports");
    const body = reports ? JSON.stringify([{ id: 1, tracking_code: "MKC-2026-TEST001", issue_type: "Blocked Drainage", location_name: "Nairobi test landmark", latitude: -1.29, longitude: 36.82, status: "Reported", risk_score: 76, risk_label: "High", created_at: "2026-10-20T10:00:00Z" }]) : "[]";
    await route.fulfill({ status: post ? 201 : 200, contentType: "application/json", body: post ? "" : body });
  });
});

async function fillReport(page) {
  await page.goto("/report");
  await page.getByLabel("Location Name", { exact: true }).fill("Nairobi test landmark");
  await page.getByLabel("Latitude", { exact: true }).fill("-1.29");
  await page.getByLabel("Longitude", { exact: true }).fill("36.82");
  await page.getByLabel("Description", { exact: true }).fill("There is a burst pipe outside the market entrance, spilling water across the road.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
}

test("report without photo saves only tracking code and recovers it after reload", async ({ page, context }) => {
  await fillReport(page);
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
  const code = await page.locator(".tracking-code-box > strong").textContent();
  expect(code.trim()).toMatch(codePattern);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy tracking code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code.trim());
  expect(await page.evaluate(() => localStorage.getItem("mkc.latestTrackingCode"))).toBe(code.trim());
  await page.reload();
  await page.goto("/track");
  await expect(page.getByRole("heading", { name: "Your most recent report" })).toBeVisible();
  await page.getByRole("button", { name: "Use this code" }).click();
  await expect(page.getByPlaceholder("Example: MKC-2026-123456")).toHaveValue(code.trim());
  await page.getByRole("button", { name: "Forget code" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your most recent report" })).toHaveCount(0);
});

test("photo upload failure preserves form and allows submitting without photo", async ({ page }) => {
  await fillReport(page);
  await page.route("**/storage/v1/object/**", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"internal detail"}' }));
  await page.getByLabel("Photo Evidence").setInputFiles({ name: "evidence.png", mimeType: "image/png", buffer: pixel });
  await expect(page.getByAltText("Selected upload preview")).toBeVisible();
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByText(/because the photo upload failed/)).toBeVisible();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Nairobi test landmark");
  await expect(page.getByText("internal detail", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Remove selected photo" }).click();
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
});

test("valid photo submission and invalid photo validation", async ({ page }) => {
  await fillReport(page);
  await page.getByLabel("Photo Evidence").setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await expect(page.getByText("Unsupported image type. Use JPEG, PNG, or WebP.", { exact: true })).toBeVisible();
  await page.getByLabel("Photo Evidence").setInputFiles({ name: "oversized.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(13 * 1024 * 1024) });
  await expect(page.getByText(/original image is too large/)).toBeVisible();
  await page.route("**/storage/v1/object/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"Key":"test.png"}' }));
  await page.getByLabel("Photo Evidence").setInputFiles({ name: "evidence.png", mimeType: "image/png", buffer: pixel });
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
});

test("geolocation denied, success, and manual fallback", async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (success, failure) => {
      if (attempts++ === 0) failure({ code: 1 });
      else success({ coords: { latitude: -1.3133, longitude: 36.787 } });
    } } });
  });
  await fillReport(page);
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText(/Location permission was denied/)).toBeVisible();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue("-1.29");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText(/Location detected successfully/)).toBeVisible();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue("-1.313300");
});

test("database failure keeps data and missing coordinates never silently use Nairobi centre", async ({ page }) => {
  await fillReport(page);
  await page.getByLabel("Latitude", { exact: true }).fill("");
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByText("Enter a latitude within Kenya (-5 to 5).")).toBeVisible();
  await page.getByLabel("Latitude", { exact: true }).fill("-1.29");
  await page.route("**/rest/v1/reports", (route) => route.fulfill({ status: 400, contentType: "application/json", body: '{"message":"private database detail"}' }));
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByText(/We could not submit your report/)).toBeVisible();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Nairobi test landmark");
  await expect(page.getByText("private database detail", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("mkc.latestTrackingCode"))).toBe(null);
});

test("suggestions remain optional and vague text has no forced classification", async ({ page }) => {
  await fillReport(page);
  const category = page.locator('select[name="issueType"]');
  await category.selectOption("Uncollected Waste");
  await expect(category).toHaveValue("Uncollected Waste");
  await page.getByRole("button", { name: "Apply suggestion" }).click();
  await expect(category).toHaveValue("Water Leak / Burst Pipe");
  await page.getByLabel("Description", { exact: true }).fill("Something seems wrong around our neighbourhood and I am unsure what caused it.");
  await expect(page.getByText(/No confident suggestion yet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply suggestion" })).toHaveCount(0);
});

for (const width of [1440, 1024, 768, 390]) {
  test(`map and footer remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/map");
    await expect(page.locator(".leaflet-map")).toBeVisible();
    const mapBox = await page.locator(".leaflet-map").boundingBox();
    expect(mapBox.height).toBeGreaterThanOrEqual(420);
    expect(mapBox.width).toBeGreaterThan(width * 0.75);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("navigation", { name: "Legal" })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`map-${width}.png`), fullPage: true });
  });
}
