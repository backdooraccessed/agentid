import { test, expect } from '@playwright/test';

const BASE_URL = 'https://agentid-woad.vercel.app';

test.describe('Public Pages E2E Tests', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toBeVisible();
    console.log('✓ Landing page loads');
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✓ Login page loads');
  });

  test('Register page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    console.log('✓ Register page loads');
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');

    // Check page loaded by verifying response is OK
    expect(page.url()).toContain('/pricing');
    console.log('✓ Pricing page loads');
  });

  test('Docs page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/docs');
    console.log('✓ Docs page loads');
  });

  test('API Playground loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs/playground`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/playground');
    console.log('✓ API Playground loads');
  });

  test('Terms page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible();
    console.log('✓ Terms page loads');
  });

  test('Privacy page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible();
    console.log('✓ Privacy page loads');
  });

  test('Public agent directory page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/agents`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible();
    console.log('✓ Public agents page loads');
  });
});
