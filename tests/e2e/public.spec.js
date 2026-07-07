import { expect, test } from "@playwright/test";

test("public homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Make Kenya Clean" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Make Kenya Clean/i })).toBeVisible();
});

test("public report form loads and requires consent", async ({ page }) => {
  await page.goto("/report");
  await expect(page.getByRole("heading", { name: /Report a Water or Sanitation Issue/i })).toBeVisible();
  await expect(page.getByLabel("Photo Evidence")).toBeVisible();
  await expect(page.getByText(/report details, location, and report photo may appear publicly/i)).toBeVisible();
});

test("invalid tracking code is handled", async ({ page }) => {
  await page.goto("/track");
  await page.getByPlaceholder("Example: MKC-2026-123456").fill("MKC-DOES-NOT-EXIST");
  await page.getByRole("button", { name: /Track Report/i }).click();
  await expect(page.getByText(/No report found/i)).toBeVisible();
});

test("public report detail does not expose reporter PII", async ({ page }) => {
  await page.goto("/reports/MKC-2026-E2E001");
  await expect(
    page.getByRole("heading", { name: "MKC-2026-E2E001" }),
  ).toBeVisible();
  await expect(page.getByText("Report Detail")).toBeVisible();
  await expect(page.getByText(/Reporter Phone|Reporter Email|reporter_phone|reporter_email/i)).toHaveCount(0);
});

test("protected admin route blocks anonymous user", async ({ page }) => {
  await page.goto("/admin/organizations");
  await expect(page.getByText(/Access Restricted|Staff Login|Protected Access/i)).toBeVisible();
});

test("anonymous users do not see organization workflow controls", async ({ page }) => {
  await page.goto("/reports/MKC-2026-331222");
  await expect(page.getByText(/Organization Workflow/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit Resolution" })).toHaveCount(0);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Staff Login/i })).toBeVisible();
});

test("request-access page loads", async ({ page }) => {
  await page.goto("/request-access");
  await expect(page.getByRole("heading", { name: /Request Access/i })).toBeVisible({
    timeout: 15000,
  });
});

test("public map loads", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: /Community Risk Map/i })).toBeVisible();
  await expect(page.locator(".leaflet-map")).toBeVisible();
});

test("privacy and terms pages load", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Use" })).toBeVisible();
});
