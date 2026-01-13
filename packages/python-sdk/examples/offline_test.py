#!/usr/bin/env python3
"""
Test offline verification with the AgentID Python SDK.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from nacl.signing import SigningKey
import base64

from agentid import AgentIDClient, verify_credential_offline, canonical_json


def create_test_credential():
    """Create a test credential with a valid signature."""
    # Generate a new key pair
    signing_key = SigningKey.generate()
    public_key = signing_key.verify_key
    public_key_b64 = base64.b64encode(bytes(public_key)).decode()

    # Create credential payload
    now = datetime.now(timezone.utc)
    credential = {
        "credential_id": "test-offline-credential",
        "agent_id": "test-offline-agent",
        "agent_name": "Offline Test Agent",
        "agent_type": "autonomous",
        "issuer": {
            "issuer_id": "test-issuer-id",
            "name": "Test Issuer",
            "issuer_type": "organization",
            "issuer_verified": False,
        },
        "permissions": {
            "actions": ["read"],
            "domains": ["test"],
        },
        "constraints": {
            "valid_from": (now - timedelta(hours=1)).isoformat(),
            "valid_until": (now + timedelta(days=30)).isoformat(),
        },
        "issued_at": now.isoformat(),
    }

    # Sign the credential
    message = canonical_json(credential).encode()
    signature = signing_key.sign(message).signature
    credential["signature"] = base64.b64encode(signature).decode()

    return credential, public_key_b64


async def main():
    print("=== Offline Verification Test ===\n")

    # Create a test credential with valid signature
    credential, public_key = create_test_credential()

    print("1. Testing valid credential")
    print(f"   Agent: {credential['agent_name']}")
    print(f"   Public Key: {public_key[:30]}...")

    result = verify_credential_offline(credential, public_key)
    print(f"   Valid: {result.valid}")
    if result.credential:
        print(f"   Agent Type: {result.credential.agent_type}")
    print()

    # Test with tampered credential
    print("2. Testing tampered credential")
    tampered = credential.copy()
    tampered["agent_name"] = "Tampered Agent"
    result = verify_credential_offline(tampered, public_key)
    print(f"   Valid: {result.valid}")
    if result.error:
        print(f"   Error: {result.error.message}")
    print()

    # Test with expired credential
    print("3. Testing expired credential")
    expired = credential.copy()
    now = datetime.now(timezone.utc)
    expired["constraints"] = {
        "valid_from": (now - timedelta(days=30)).isoformat(),
        "valid_until": (now - timedelta(days=1)).isoformat(),
    }
    # Re-sign with expired dates
    signing_key = SigningKey.generate()
    message = canonical_json({k: v for k, v in expired.items() if k != "signature"}).encode()
    signature = signing_key.sign(message).signature
    expired["signature"] = base64.b64encode(signature).decode()
    expired_public_key = base64.b64encode(bytes(signing_key.verify_key)).decode()

    result = verify_credential_offline(expired, expired_public_key)
    print(f"   Valid: {result.valid}")
    if result.error:
        print(f"   Error: {result.error.message}")
    print()

    # Test using AgentIDClient
    print("4. Testing via AgentIDClient.verify_offline()")
    async with AgentIDClient() as client:
        result = await client.verify_offline(credential, public_key)
        print(f"   Valid: {result.valid}")
        if result.credential:
            print(f"   Agent: {result.credential.agent_name}")
    print()

    print("=== Offline Test Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
