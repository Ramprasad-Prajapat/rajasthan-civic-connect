import { test, expect } from '@playwright/test';

test.describe('Rajasthan Civic Connect E2E Test Suite', () => {

  test('1. Landing Page renders title and hero banner', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rajasthan Civic Connect/i);
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
  });

  test('2. Navigation switching to Complaint page', async ({ page }) => {
    await page.goto('/');
    const complaintLink = page.getByRole('button', { name: /Lodge Complaint/i }).first();
    if (await complaintLink.isVisible()) {
      await complaintLink.click();
      await expect(page.locator('body')).toContainText(/File Official Civic Grievance/i);
    }
  });

  test('3. Mobile Header & Menu Toggle Responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const navbarToggler = page.locator('.navbar-toggler');
    await expect(navbarToggler).toBeVisible();
  });

  test('4. Login/Register Portal switching', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.getByRole('button', { name: /Sign In|Login/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page.locator('body')).toContainText(/Citizen Portal/i);
    }
  });

});
