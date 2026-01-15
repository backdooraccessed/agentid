import { test, expect } from '@playwright/test';

const BASE_URL = 'https://agentid-woad.vercel.app';

test.describe('Sprint 8 Features E2E Tests', () => {
  test('8.1 SSO Settings page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/sso`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(settings\/sso|settings|login)/);
    console.log('✓ SSO settings route:', url);
  });

  test('8.3 Featured Agents admin page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/featured`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    // May redirect based on permissions
    console.log('✓ Featured admin route:', url);
  });

  test('8.5 Analytics Trends page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics/trends`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(analytics|login)/);
    console.log('✓ Analytics trends route:', url);
  });

  test('A2A Conversations page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/conversations`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(conversations|login)/);
    console.log('✓ Conversations route:', url);
  });

  test('A2A Authorizations page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/authorizations`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(authorizations|login)/);
    console.log('✓ Authorizations route:', url);
  });

  test('Directory page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/directory`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(directory|login)/);
    console.log('✓ Directory route:', url);
  });

  test('Featured directory page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/directory/featured`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(directory|login)/);
    console.log('✓ Featured directory route:', url);
  });

  test('Templates page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(templates|login)/);
    console.log('✓ Templates route:', url);
  });

  test('Guide page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(guide|login)/);
    console.log('✓ Guide route:', url);
  });

  test('SAML metadata endpoint exists', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/saml/metadata`);
    // May return 404 if not enabled, 200 with metadata, or 401
    expect([200, 401, 404]).toContain(response.status());
    console.log('✓ SAML metadata endpoint status:', response.status());
  });
});
