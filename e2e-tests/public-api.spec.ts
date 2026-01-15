import { test, expect } from '@playwright/test';

const BASE_URL = 'https://agentid-woad.vercel.app';

test.describe('Public API E2E Tests', () => {
  test('Health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    console.log('✓ Health endpoint works:', body.status);
  });

  test('Public verification API works', async ({ request }) => {
    // Test with invalid credential - should return valid response structure
    const response = await request.post(`${BASE_URL}/api/verify`, {
      data: {
        credential_id: '00000000-0000-0000-0000-000000000000'
      }
    });

    // Should return 200 with valid:false or 400/404
    expect([200, 400, 404]).toContain(response.status());
    console.log('✓ Verify API responds correctly');
  });

  test('Batch verification API works', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/verify/batch`, {
      data: {
        credentials: [
          { credential_id: '00000000-0000-0000-0000-000000000000' }
        ]
      }
    });

    expect([200, 400]).toContain(response.status());
    console.log('✓ Batch verify API responds');
  });

  test('Directory API works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/directory`);
    expect([200, 401]).toContain(response.status());
    console.log('✓ Directory API responds');
  });

  test('Registry API works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/registry`);
    expect([200, 401]).toContain(response.status());
    console.log('✓ Registry API responds');
  });

  test('Featured agents API works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/registry/featured`);
    expect([200, 401]).toContain(response.status());
    console.log('✓ Featured agents API responds');
  });

  test('Leaderboard API works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reputation/leaderboard`);
    expect([200, 401]).toContain(response.status());
    console.log('✓ Leaderboard API responds');
  });
});
