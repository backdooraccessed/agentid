#!/usr/bin/env python3
"""
Live test of the AgentID Python SDK against the production API.
"""

import asyncio
from agentid import AgentIDClient


async def main():
    print("=== AgentID Python SDK Live Test ===\n")

    # Test credential IDs
    trading_bot_id = "a749aeb8-61fb-4419-b808-1079893cd996"
    demo_agent_id = "092bca2f-40a3-4ae2-9757-8f3ed9f070f8"

    async with AgentIDClient() as client:
        # 1. Single verification
        print("1. Single Credential Verification")
        print(f"   Verifying: {trading_bot_id}")
        result = await client.verify(credential_id=trading_bot_id)
        print(f"   Valid: {result.valid}")
        if result.valid and result.credential:
            print(f"   Agent: {result.credential.agent_name}")
            print(f"   Type: {result.credential.agent_type}")
            print(f"   Issuer: {result.credential.issuer.name}")
        print()

        # 2. Batch verification
        print("2. Batch Verification")
        batch_result = await client.verify_batch([
            {"credential_id": trading_bot_id},
            {"credential_id": demo_agent_id},
        ])
        print(f"   Total: {batch_result.summary.total}")
        print(f"   Valid: {batch_result.summary.valid}")
        print(f"   Invalid: {batch_result.summary.invalid}")
        print(f"   Time: {batch_result.verification_time_ms}ms")
        for item in batch_result.results:
            status = "✓" if item.valid else "✗"
            name = item.credential.agent_name if item.credential else "Unknown"
            print(f"   [{status}] {name}")
        print()

        # 3. Get reputation
        print("3. Agent Reputation")
        print(f"   Checking: {trading_bot_id}")
        try:
            reputation = await client.get_reputation(trading_bot_id)
            print(f"   Trust Score: {reputation.trust_score}")
            print(f"   Verifications: {reputation.verification_count}")
            print(f"   Success Rate: {reputation.success_rate:.1%}")
            print(f"   Credential Age: {reputation.credential_age_days} days")
            print(f"   Issuer Verified: {reputation.issuer_verified}")
        except Exception as e:
            print(f"   Error: {e}")
        print()

        # 4. Get leaderboard
        print("4. Reputation Leaderboard")
        try:
            leaderboard = await client.get_leaderboard(limit=5)
            for entry in leaderboard:
                verified = "✓" if entry.issuer_verified else ""
                print(f"   #{entry.rank} {entry.agent_name} (score: {entry.trust_score}) {verified}")
        except Exception as e:
            print(f"   Error: {e}")
        print()

    print("=== Test Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
