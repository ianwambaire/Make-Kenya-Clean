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
  await page.getByText("Advanced: enter coordinates", { exact: true }).click();
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
  await expect(page.getByText("Please use your current location or select a point on the map within Kenya.")).toBeVisible();
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

test("validation focuses each missing field in order and retains input", async ({ page }) => {
  await page.goto("/report");
  const submit = page.getByRole("button", { name: "Submit Report", exact: true });
  const locationName = page.getByLabel("Location Name", { exact: true });
  await submit.click();
  await expect(locationName).toBeFocused();
  await expect(locationName).toBeInViewport();
  await expect(locationName).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/Please provide a location or landmark/)).toBeVisible();
  await locationName.fill("Kibera market entrance");
  await submit.click();
  const chooseMap = page.getByRole("button", { name: "Select location on map", exact: true });
  await expect(chooseMap).toBeFocused();
  await chooseMap.click();
  await expect(page.locator(".report-location-map")).toBeVisible();
  await page.getByRole("button", { name: "Use map centre" }).click();
  await submit.click();
  const description = page.getByLabel("Description", { exact: true });
  await expect(description).toBeFocused();
  await expect(description).toBeInViewport();
  await description.fill("Water is flooding the entrance to the market.");
  await submit.click();
  await expect(page.getByRole("checkbox", { name: /I understand/ })).toBeFocused();
  await expect(locationName).toHaveValue("Kibera market entrance");
});

test("map selection after geolocation failure submits internal coordinates", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_success, failure) => failure({ code: 1 }) } });
  });
  await page.goto("/report");
  await page.getByLabel("Location Name", { exact: true }).fill("Kibera market entrance");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText(/Location permission was denied/)).toBeVisible();
  await page.getByRole("button", { name: "Select location on map", exact: true }).click();
  const map = page.locator(".report-location-map");
  await expect(map).toBeVisible();
  const bounds = await map.boundingBox();
  await map.click({ position: { x: bounds.width * 0.55, y: bounds.height * 0.55 } });
  await expect(map.locator(".leaflet-marker-icon")).toHaveCount(1);
  await expect(map.locator(".leaflet-marker-icon")).toBeVisible();
  await expect.poll(() => map.locator(".leaflet-marker-icon").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.getByText(/Location selected. The pin/)).toBeVisible();
  const latitude = page.getByLabel("Latitude", { exact: true });
  const before = await latitude.inputValue();
  await map.click({ position: { x: bounds.width * 0.7, y: bounds.height * 0.6 } });
  await expect(latitude).not.toHaveValue(before);
  const selectedLatitude = await latitude.inputValue();
  const selectedLongitude = await page.getByLabel("Longitude", { exact: true }).inputValue();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".report-location-picker").screenshot({ path: test.info().outputPath("location-picker.png") });
  await page.getByLabel("Description", { exact: true }).fill("Water is flooding the entrance to the market.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  const requestPromise = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname.endsWith("/reports"));
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  const body = (await requestPromise).postDataJSON();
  expect(body.latitude).toBe(Number(selectedLatitude));
  expect(body.longitude).toBe(Number(selectedLongitude));
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
});

test("mobile menu closes on navigation and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/report");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const toggle = page.getByRole("button", { name: "Open navigation menu" });
  await expect(toggle).toBeVisible();
  await expect(nav.getByRole("link", { name: "Track", exact: true })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");
  await nav.screenshot({ path: test.info().outputPath("mobile-menu-open.png") });
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await nav.getByRole("link", { name: "Track", exact: true }).click();
  await expect(page).toHaveURL(/\/track$/);
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("mobile-navigation.png"), fullPage: true });
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
