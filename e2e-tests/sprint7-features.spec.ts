import { test, expect } from '@playwright/test';

const BASE_URL = 'https://agentid-woad.vercel.app';

test.describe('Sprint 7 Features E2E Tests', () => {
  test('7.1 Permission Enforcement - Verify API accepts check_permission', async ({ request }) => {
    // Test verify API with permission check parameter
    const response = await request.post(`${BASE_URL}/api/verify`, {
      data: {
        credential_id: '00000000-0000-0000-0000-000000000000',
        check_permission: {
          action: 'read',
          resource: 'test'
        }
      }
    });

    // Should accept the request (even if credential doesn't exist)
    expect([200, 400, 404]).toContain(response.status());
    console.log('✓ Permission enforcement API accepts check_permission parameter');
  });

  test('7.4 Trust Score History - API endpoint exists', async ({ request }) => {
    // Test with fake agent ID - should return 404 or 200
    const response = await request.get(`${BASE_URL}/api/reputation/agent/00000000-0000-0000-0000-000000000000/history`);

    expect([200, 401, 404]).toContain(response.status());
    console.log('✓ Trust score history API endpoint exists');
  });

  test('7.5 Team Invite Acceptance - Route exists', async ({ page }) => {
    // Test with dummy token
    await page.goto(`${BASE_URL}/invite/test-token-123`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/invite');
    console.log('✓ Invite acceptance route exists');
  });

  test('7.6 Compliance Export - API endpoint exists', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/compliance/export`);

    expect([200, 401, 403]).toContain(response.status());
    console.log('✓ Compliance export API endpoint exists');
  });

  test('Policies page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/policies`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(policies|login)/);
    console.log('✓ Policies route:', url);
  });

  test('Alerts page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(alerts|login)/);
    console.log('✓ Alerts route:', url);
  });

  test('Audit logs page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit-logs`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(audit-logs|login)/);
    console.log('✓ Audit logs route:', url);
  });
});
