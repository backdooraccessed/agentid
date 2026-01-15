"""
Basic usage example for AgentID Python SDK.

This example shows how to use the SDK to make authenticated
requests to services that accept AgentID credentials.
"""

import asyncio

from agentid import AgentCredential, AgentClient


async def main():
    # Example 1: Basic credential usage
    print("=== Example 1: Basic AgentCredential ===")

    cred = AgentCredential("cred_example")

    # Load credential (happens automatically on first request)
    try:
        await cred.load_async()
        print(f"Loaded credential for: {cred._credential_data.agent_name}")
        print(f"Expires in: {cred.time_to_expiry:.0f} seconds")
    except Exception as e:
        print(f"Error loading credential: {e}")
        # Continue with examples anyway for demonstration

    # Get headers to add to your own requests
    headers = cred.get_headers(
        method="GET",
        url="https://api.example.com/data",
    )
    print(f"Headers to include: {list(headers.keys())}")

    # Example 2: Making requests with AgentCredential
    print("\n=== Example 2: Making Requests ===")

    # Async request (uses httpx under the hood)
    # response = await cred.request_async("https://api.example.com/data")
    # print(f"Response status: {response.status_code}")

    # Sync request
    # response = cred.request("https://api.example.com/data", method="POST", json={"key": "value"})
    # print(f"Response: {response.json()}")

    print("(Skipped actual requests - uncomment to test with real API)")

    # Example 3: Using AgentClient
    print("\n=== Example 3: Using AgentClient ===")

    # AgentClient provides a higher-level interface
    # async with AgentClient("cred_example", base_url="https://api.example.com") as client:
    #     response = await client.get("/data")
    #     response = await client.post("/users", json={"name": "Test"})

    print("(Skipped - uncomment to test with real API)")

    # Example 4: Wrapping existing httpx client
    print("\n=== Example 4: Wrapping httpx Client ===")

    import httpx

    async with httpx.AsyncClient() as client:
        # Wrap the client to auto-inject headers
        cred.wrap_httpx(client)

        # Now all requests include AgentID headers
        # response = await client.get("https://api.example.com/data")

    print("(Skipped - uncomment to test with real API)")


if __name__ == "__main__":
    asyncio.run(main())
