/**
 * Basic usage example for AgentID TypeScript SDK
 *
 * This example shows how to use the SDK to make authenticated
 * requests to services that accept AgentID credentials.
 */

import { AgentCredential, AgentIDError } from '../src';

async function main() {
  // Example 1: Basic credential usage
  console.log('=== Example 1: Basic AgentCredential ===\n');

  const cred = new AgentCredential('cred_example');

  // Load credential (happens automatically on first request)
  try {
    await cred.load();
    console.log(`Loaded credential for: ${cred.data?.agent_name}`);
    console.log(`Expires in: ${Math.floor(cred.timeToExpiry / 1000)} seconds`);
  } catch (error) {
    if (error instanceof AgentIDError) {
      console.log(`Error loading credential: ${error.message}`);
    }
  }

  // Get headers to add to your own requests
  const headers = await cred.getHeaders('GET', 'https://api.example.com/data');
  console.log('Headers to include:', Object.keys(headers));

  // Example 2: Making requests with AgentCredential
  console.log('\n=== Example 2: Making Requests ===\n');

  // Using the built-in fetch wrapper
  // const response = await cred.fetch('https://api.example.com/data');
  // console.log(`Response status: ${response.status}`);

  // With POST and body
  // const response = await cred.fetch('https://api.example.com/users', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name: 'New User' }),
  // });

  console.log('(Skipped actual requests - uncomment to test with real API)');

  // Example 3: Creating an authenticated fetch function
  console.log('\n=== Example 3: Authenticated Fetch ===\n');

  const authenticatedFetch = cred.createFetch();

  // Use it like regular fetch
  // const response = await authenticatedFetch('https://api.example.com/data');

  console.log('Created authenticated fetch function');

  // Example 4: Credential lifecycle
  console.log('\n=== Example 4: Credential Lifecycle ===\n');

  console.log(`Is loaded: ${cred.isLoaded}`);
  console.log(`Is active: ${cred.isActive}`);
  console.log(`Is expired: ${cred.isExpired}`);
  console.log(`Time to expiry: ${cred.timeToExpiry}ms`);
  console.log(`Needs refresh: ${cred.needsRefresh}`);
}

main().catch(console.error);
