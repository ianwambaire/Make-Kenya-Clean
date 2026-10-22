import { expect, test } from "@playwright/test";

const codePattern = /^MKC-\d{4}-[A-Z0-9]+$/;
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

test.beforeEach(async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/reverse?**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ address: { suburb: "Madaraka Estate", city: "Nairobi", county: "Nairobi County", postcode: "00100", country: "Kenya" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const post = route.request().method() === "POST";
    const reports = new URL(route.request().url()).pathname.endsWith("/public_reports");
    const body = reports ? JSON.stringify([{ id: 1, tracking_code: "MKC-2026-TEST001", issue_type: "Blocked Drainage", location_name: "Nairobi test landmark", latitude: -1.29, longitude: 36.82, status: "Reported", risk_score: 76, risk_label: "High", created_at: "2026-10-20T10:00:00Z" }]) : "[]";
    await route.fulfill({ status: post ? 201 : 200, contentType: "application/json", body: post ? "" : body });
  });
});

async function fillReport(page, { selectLocation = true } = {}) {
  await page.goto("/report");
  if (selectLocation) {
    await page.getByRole("button", { name: "Select location on map", exact: true }).click();
    await page.getByRole("button", { name: "Use map centre" }).click();
    await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Madaraka Estate, Nairobi");
  }
  await page.getByLabel("Location Name", { exact: true }).fill("Nairobi test landmark");
  await page.getByLabel("Description", { exact: true }).fill("There is a burst pipe outside the market entrance, spilling water across the road.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
}

async function submitAndReadReport(page) {
  const request = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname.endsWith("/reports"));
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  const body = (await request).postDataJSON();
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
  return body;
}

async function mockGps(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (success) => success({ coords: { latitude: -1.309, longitude: 36.812 } }) } });
  });
}

test("insecure context does not request GPS and preserves map fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "isSecureContext", { value: false });
    window.gpsRequests = 0;
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: () => { window.gpsRequests += 1; } } });
  });
  await page.goto("/report");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("Current location requires a secure HTTPS connection on this device. Please use the secure deployed website or select the location on the map.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.gpsRequests)).toBe(0);
  await expect(page.getByText(/Location access was denied/)).toHaveCount(0);
  await page.getByRole("button", { name: "Select location on map", exact: true }).click();
  await page.getByRole("button", { name: "Use map centre" }).click();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Madaraka Estate, Nairobi");
});

for (const [code, message] of [
  [1, "Location access was denied. In Safari, allow Location for this website and try again, or select the location on the map."],
  [2, "We couldn't determine your location. Please try again or select the location on the map."],
  [3, "Location detection took too long. Please try again or select the location on the map."],
]) {
  test(`secure context shows specific geolocation error ${code} and keeps selected location`, async ({ page }) => {
    await page.addInitScript((errorCode) => {
      Object.defineProperty(window, "isSecureContext", { value: true });
      window.gpsRequests = 0;
      Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_success, failure) => {
        window.gpsRequests += 1;
        failure({ code: errorCode });
      } } });
    }, code);
    await fillReport(page);
    await page.getByRole("button", { name: "Use my current location" }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.gpsRequests)).toBe(1);
    await expect(page.getByRole("button", { name: "Use my current location" })).toBeEnabled();
    await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Nairobi test landmark");
    const body = await submitAndReadReport(page);
    expect(body.latitude).toBe(-1.2921);
    expect(body.longitude).toBe(36.8219);
  });
}

test("GPS populates a concise named place and caches repeat lookups", async ({ page }) => {
  await mockGps(page);
  let lookups = 0;
  await page.route("https://nominatim.openstreetmap.org/reverse?**", (route) => {
    lookups += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ category: "amenity", name: "Strathmore University", address: { amenity: "Strathmore University", suburb: "Madaraka Estate", city: "Nairobi", country: "Kenya", postcode: "00100" } }) });
  });
  await page.goto("/report");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("Location detected. Finding location name...", { exact: true })).toBeVisible();
  const name = page.getByLabel("Location Name", { exact: true });
  await expect(name).toHaveValue("Strathmore University, Nairobi");
  await expect(page.getByText("Location detected: Strathmore University, Nairobi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("Location detected: Strathmore University, Nairobi", { exact: true })).toBeVisible();
  expect(lookups).toBe(1);
  await name.fill("University main gate");
  await page.getByLabel("Description", { exact: true }).fill("Water is flowing across the entrance.");
  await expect(name).toHaveValue("University main gate");
  expect(lookups).toBe(1);
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  const body = await submitAndReadReport(page);
  expect(body.latitude).toBe(-1.309);
  expect(body.longitude).toBe(36.812);
  expect(body.location_name).toBe("University main gate");
});

test("GPS survives a reverse-geocoding failure and manual landmark can be submitted", async ({ page }) => {
  await mockGps(page);
  await page.route("https://nominatim.openstreetmap.org/reverse?**", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto("/report");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("Location detected, but we could not determine the place name. You can enter a landmark manually.", { exact: true })).toBeVisible();
  await page.getByLabel("Location Name", { exact: true }).fill("University main gate");
  await page.getByLabel("Description", { exact: true }).fill("Water is flowing across the entrance.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  const body = await submitAndReadReport(page);
  expect(body.latitude).toBe(-1.309);
  expect(body.longitude).toBe(36.812);
});

test("a delayed place lookup cannot overwrite a manually edited landmark", async ({ page }) => {
  await mockGps(page);
  let releaseResponse;
  const responseGate = new Promise((resolve) => { releaseResponse = resolve; });
  await page.route("https://nominatim.openstreetmap.org/reverse?**", async (route) => {
    await responseGate;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ address: { amenity: "Strathmore University", city: "Nairobi" } }) });
  });
  await page.goto("/report");
  const requestStarted = page.waitForRequest("https://nominatim.openstreetmap.org/reverse?**");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await requestStarted;
  await page.getByLabel("Location Name", { exact: true }).fill("My chosen landmark");
  const responseFinished = page.waitForResponse("https://nominatim.openstreetmap.org/reverse?**");
  releaseResponse();
  await (await responseFinished).finished();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("My chosen landmark");
  await expect(page.getByText("Landmark updated. Your selected location has been kept.", { exact: true })).toBeVisible();
});

test("typing a landmark while GPS is pending preserves the name and still accepts coordinates", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (success) => { window.finishLocation = () => success({ coords: { latitude: -1.309, longitude: 36.812 } }); } } });
  });
  await page.goto("/report");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await page.getByLabel("Location Name", { exact: true }).fill("University main gate");
  await page.evaluate(() => window.finishLocation());
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("University main gate");
  await expect(page.getByText("Location detected. Your manually entered landmark has been kept.", { exact: true })).toBeVisible();
  await page.getByLabel("Description", { exact: true }).fill("Water is flowing across the entrance.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  const body = await submitAndReadReport(page);
  expect(body.latitude).toBe(-1.309);
  expect(body.longitude).toBe(36.812);
});

test("changing map points updates the place name", async ({ page }) => {
  let lookups = 0;
  await page.route("https://nominatim.openstreetmap.org/reverse?**", (route) => {
    const address = ++lookups === 1
      ? { building: "Community Hall", city: "Nairobi" }
      : { road: "Mbagathi Way", city: "Nairobi" };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ address }) });
  });
  await page.goto("/report");
  await page.getByRole("button", { name: "Select location on map", exact: true }).click();
  const map = page.locator(".report-location-map");
  await expect(map).toBeVisible();
  const bounds = await map.boundingBox();
  await map.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.5 } });
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Community Hall, Nairobi");
  await map.click({ position: { x: bounds.width * 0.7, y: bounds.height * 0.6 } });
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Mbagathi Way, Nairobi");
  expect(lookups).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

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

test("geolocation denied, success, and map fallback", async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (success, failure) => {
      if (attempts++ === 0) failure({ code: 1 });
      else success({ coords: { latitude: -1.3133, longitude: 36.787 } });
    } } });
  });
  await fillReport(page);
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText(/Location access was denied/)).toBeVisible();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Nairobi test landmark");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText("Location detected: Madaraka Estate, Nairobi", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Madaraka Estate, Nairobi");
  const body = await submitAndReadReport(page);
  expect(body.latitude).toBe(-1.3133);
  expect(body.longitude).toBe(36.787);
});

test("database failure keeps data and missing coordinates never silently use Nairobi centre", async ({ page }) => {
  await fillReport(page, { selectLocation: false });
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  await expect(page.getByText("Please use your current location or select the issue location on the map.")).toBeVisible();
  const mapButton = page.getByRole("button", { name: "Select location on map", exact: true });
  await expect(mapButton).toBeFocused();
  await expect(mapButton).toBeInViewport();
  await mapButton.click();
  await page.getByRole("button", { name: "Use map centre" }).click();
  await expect(page.getByLabel("Location Name", { exact: true })).toHaveValue("Madaraka Estate, Nairobi");
  await page.getByLabel("Location Name", { exact: true }).fill("Nairobi test landmark");
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
  await expect(locationName).toHaveValue("Madaraka Estate, Nairobi");
});

test("map selection after geolocation failure submits internal coordinates", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_success, failure) => failure({ code: 1 }) } });
  });
  await page.goto("/report");
  await page.getByLabel("Location Name", { exact: true }).fill("Kibera market entrance");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByText(/Location access was denied/)).toBeVisible();
  await page.getByRole("button", { name: "Select location on map", exact: true }).click();
  const map = page.locator(".report-location-map");
  await expect(map).toBeVisible();
  const bounds = await map.boundingBox();
  await map.click({ position: { x: bounds.width * 0.55, y: bounds.height * 0.55 } });
  await expect(map.locator(".leaflet-marker-icon")).toHaveCount(1);
  await expect(map.locator(".leaflet-marker-icon")).toBeVisible();
  await expect.poll(() => map.locator(".leaflet-marker-icon").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.getByText("Location detected: Madaraka Estate, Nairobi", { exact: true })).toBeVisible();
  const lookupRequest = page.waitForRequest("https://nominatim.openstreetmap.org/reverse?**");
  await map.click({ position: { x: bounds.width * 0.7, y: bounds.height * 0.6 } });
  const selectedPoint = new URL((await lookupRequest).url()).searchParams;
  await expect(page.getByText("Location detected: Madaraka Estate, Nairobi", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".report-location-picker").screenshot({ path: test.info().outputPath("location-picker.png") });
  await page.getByLabel("Description", { exact: true }).fill("Water is flooding the entrance to the market.");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  const requestPromise = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname.endsWith("/reports"));
  await page.getByRole("button", { name: "Submit Report", exact: true }).click();
  const body = (await requestPromise).postDataJSON();
  expect(body.latitude).toBeCloseTo(Number(selectedPoint.get("lat")), 4);
  expect(body.longitude).toBeCloseTo(Number(selectedPoint.get("lon")), 4);
  expect(body.latitude).toBeGreaterThanOrEqual(-5);
  expect(body.longitude).toBeGreaterThanOrEqual(33);
  await expect(page.getByRole("heading", { name: "Report Submitted" })).toBeVisible();
});

test("public report form has no latitude or longitude fields on desktop or mobile", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/report");
    await expect(page.getByRole("button", { name: "Use my current location" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select location on map", exact: true })).toBeVisible();
    await expect(page.getByLabel("Location Name", { exact: true })).toBeVisible();
    await expect(page.locator('input[name="latitude"], input[name="longitude"]')).toHaveCount(0);
    await expect(page.getByLabel("Latitude", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Longitude", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Advanced: enter coordinates", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
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
