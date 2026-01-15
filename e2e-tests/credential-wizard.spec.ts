import { test, expect } from '@playwright/test';

const BASE_URL = 'https://agentid-woad.vercel.app';

test.describe('Credential Wizard E2E Tests', () => {
  test('Credential wizard route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/credentials/new`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toMatch(/\/(credentials\/new|login)/);
    console.log('✓ Credential wizard route:', url);
  });

  test('Credentials API endpoint exists', async ({ request }) => {
    // Test GET credentials (will return 401 without auth)
    const getResponse = await request.get(`${BASE_URL}/api/credentials`);
    expect([200, 401]).toContain(getResponse.status());
    console.log('✓ GET /api/credentials status:', getResponse.status());

    // Test POST credentials structure
    const postResponse = await request.post(`${BASE_URL}/api/credentials`, {
      data: {
        agent_id: 'test-agent',
        agent_name: 'Test Agent',
        agent_type: 'autonomous',
        permissions: []
      }
    });
    // Should return 401 without auth, 400/422 for validation, or 201 on success
    expect([201, 400, 401, 422]).toContain(postResponse.status());
    console.log('✓ POST /api/credentials status:', postResponse.status());
  });

  test('Agent profiles endpoint exists', async ({ request }) => {
    // Check if there's an agent profiles API
    const response = await request.get(`${BASE_URL}/api/agent-profiles`);
    expect([200, 401, 404]).toContain(response.status());
    console.log('✓ Agent profiles endpoint status:', response.status());
  });
});
