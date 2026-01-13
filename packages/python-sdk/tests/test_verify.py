"""
Tests for offline verification.
"""

from datetime import datetime, timedelta, timezone

import pytest
from nacl.signing import SigningKey

from agentid.crypto import canonical_json, base64_encode
from agentid.verify import verify_credential_offline
from agentid.types import ErrorCode


def create_test_credential(
    valid_from: datetime | None = None,
    valid_until: datetime | None = None,
) -> tuple[dict, str]:
    """Create a test credential with a valid signature."""
    # Generate key pair
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key

    # Set default validity
    if valid_from is None:
        valid_from = datetime.now(timezone.utc) - timedelta(days=1)
    if valid_until is None:
        valid_until = datetime.now(timezone.utc) + timedelta(days=30)

    # Build credential payload (without signature)
    credential = {
        "credential_id": "test-credential-123",
        "agent_id": "test-agent-001",
        "agent_name": "Test Agent",
        "agent_type": "autonomous",
        "issuer": {
            "issuer_id": "issuer-123",
            "issuer_type": "organization",
            "issuer_verified": True,
            "name": "Test Issuer",
        },
        "permissions": {
            "actions": ["read", "write"],
            "domains": ["finance"],
        },
        "constraints": {
            "valid_from": valid_from.isoformat().replace("+00:00", "Z"),
            "valid_until": valid_until.isoformat().replace("+00:00", "Z"),
            "geographic_restrictions": [],
            "allowed_services": [],
        },
        "issued_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    # Sign the credential
    message = canonical_json(credential).encode("utf-8")
    signed = signing_key.sign(message)
    signature = base64_encode(signed.signature)
    credential["signature"] = signature

    # Return credential and public key
    public_key = base64_encode(bytes(verify_key))
    return credential, public_key


class TestVerifyCredentialOffline:
    """Test offline credential verification."""

    def test_valid_credential(self) -> None:
        """Test verification of a valid credential."""
        credential, public_key = create_test_credential()
        result = verify_credential_offline(credential, public_key)

        assert result.valid is True
        assert result.credential is not None
        assert result.credential.agent_id == "test-agent-001"
        assert result.credential.agent_name == "Test Agent"
        assert result.error is None

    def test_expired_credential(self) -> None:
        """Test verification of an expired credential."""
        credential, public_key = create_test_credential(
            valid_from=datetime.now(timezone.utc) - timedelta(days=60),
            valid_until=datetime.now(timezone.utc) - timedelta(days=30),
        )
        result = verify_credential_offline(credential, public_key)

        assert result.valid is False
        assert result.error is not None
        assert result.error.code == ErrorCode.CREDENTIAL_EXPIRED

    def test_not_yet_valid_credential(self) -> None:
        """Test verification of a credential not yet valid."""
        credential, public_key = create_test_credential(
            valid_from=datetime.now(timezone.utc) + timedelta(days=30),
            valid_until=datetime.now(timezone.utc) + timedelta(days=60),
        )
        result = verify_credential_offline(credential, public_key)

        assert result.valid is False
        assert result.error is not None
        assert result.error.code == ErrorCode.CREDENTIAL_NOT_YET_VALID

    def test_invalid_signature(self) -> None:
        """Test verification with wrong public key."""
        credential, _ = create_test_credential()

        # Use a different key
        wrong_key = SigningKey.generate().verify_key
        wrong_public_key = base64_encode(bytes(wrong_key))

        result = verify_credential_offline(credential, wrong_public_key)

        assert result.valid is False
        assert result.error is not None
        assert result.error.code == ErrorCode.INVALID_SIGNATURE

    def test_missing_signature(self) -> None:
        """Test verification of credential without signature."""
        credential, public_key = create_test_credential()
        del credential["signature"]

        result = verify_credential_offline(credential, public_key)

        assert result.valid is False
        assert result.error is not None
        assert result.error.code == ErrorCode.INVALID_SIGNATURE

    def test_tampered_credential(self) -> None:
        """Test verification of tampered credential."""
        credential, public_key = create_test_credential()
        credential["agent_name"] = "Tampered Name"

        result = verify_credential_offline(credential, public_key)

        assert result.valid is False
        assert result.error is not None
        assert result.error.code == ErrorCode.INVALID_SIGNATURE
