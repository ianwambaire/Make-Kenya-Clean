import { expect, test } from "@playwright/test";

async function login(page, email, password) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
const championEmail = process.env.PLAYWRIGHT_CHAMPION_EMAIL;
const championPassword = process.env.PLAYWRIGHT_CHAMPION_PASSWORD;
const orgEmail = process.env.PLAYWRIGHT_ORG_EMAIL;
const orgPassword = process.env.PLAYWRIGHT_ORG_PASSWORD;

test.describe("authenticated role smoke tests", () => {
  test("admin can open operational dashboard", async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, "Admin credentials are not configured.");

    await login(page, adminEmail, adminPassword);
    await page.goto("/dashboard");
    await expect(page.getByText("Organizations")).toBeVisible();
    await expect(page.getByText("Access Requests")).toBeVisible();
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
  });

  test("champion cannot access admin organizations", async ({ page }) => {
    test.skip(!championEmail || !championPassword, "Champion credentials are not configured.");

    await login(page, championEmail, championPassword);
    await page.goto("/admin/organizations");
    await expect(page.getByText(/Access Restricted|Protected Access/i)).toBeVisible();
  });

  test("organization user cannot access admin pages", async ({ page }) => {
    test.skip(!orgEmail || !orgPassword, "Organization credentials are not configured.");

    await login(page, orgEmail, orgPassword);
    await page.goto("/admin/access-requests");
    await expect(page.getByText(/Access Restricted|Protected Access/i)).toBeVisible();
  });
});
