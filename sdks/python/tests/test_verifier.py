"""Tests for credential verification."""

import time
from unittest.mock import MagicMock, patch

import pytest

from agentid import CredentialVerifier
from agentid.verifier import check_permission
from agentid.types import Permission


class TestCredentialVerifier:
    """Tests for CredentialVerifier."""

    @pytest.fixture
    def verifier(self):
        """Create a verifier for testing."""
        return CredentialVerifier()

    def test_init_defaults(self):
        """Test default initialization."""
        verifier = CredentialVerifier()
        assert verifier.api_base == "https://agentid.dev/api"
        assert verifier.cache_ttl == 300.0
        assert verifier.verify_signature is True

    def test_init_custom(self):
        """Test custom initialization."""
        verifier = CredentialVerifier(
            api_base="https://custom.api.com/api",
            cache_ttl=600.0,
            verify_signature=False,
        )
        assert verifier.api_base == "https://custom.api.com/api"
        assert verifier.cache_ttl == 600.0
        assert verifier.verify_signature is False

    def test_extract_credential_info(self, verifier):
        """Test header extraction."""
        headers = {
            "X-AgentID-Credential": "cred_123",
            "X-AgentID-Timestamp": "1234567890",
            "X-AgentID-Nonce": "abc123",
            "X-AgentID-Signature": "sig_xyz",
            "Content-Type": "application/json",
        }

        cred_id, timestamp, nonce, signature = verifier._extract_credential_info(headers)

        assert cred_id == "cred_123"
        assert timestamp == "1234567890"
        assert nonce == "abc123"
        assert signature == "sig_xyz"

    def test_extract_credential_info_case_insensitive(self, verifier):
        """Test header extraction is case-insensitive."""
        headers = {
            "x-agentid-credential": "cred_123",
            "x-agentid-timestamp": "1234567890",
        }

        cred_id, timestamp, nonce, signature = verifier._extract_credential_info(headers)

        assert cred_id == "cred_123"
        assert timestamp == "1234567890"

    def test_verify_request_missing_credential(self, verifier):
        """Test verification fails with missing credential header."""
        result = verifier.verify_request(
            headers={},
            method="GET",
            url="https://api.example.com/data",
        )

        assert result.valid is False
        assert result.error_code == "MISSING_CREDENTIAL"

    def test_verify_request_missing_signature(self, verifier):
        """Test verification fails with missing signature headers."""
        result = verifier.verify_request(
            headers={"X-AgentID-Credential": "cred_123"},
            method="GET",
            url="https://api.example.com/data",
        )

        assert result.valid is False
        assert result.error_code == "MISSING_SIGNATURE"

    def test_verify_request_expired_signature(self, verifier):
        """Test verification fails with expired timestamp."""
        old_timestamp = str(int(time.time()) - 600)  # 10 minutes ago

        result = verifier.verify_request(
            headers={
                "X-AgentID-Credential": "cred_123",
                "X-AgentID-Timestamp": old_timestamp,
                "X-AgentID-Signature": "sig_abc",
            },
            method="GET",
            url="https://api.example.com/data",
        )

        assert result.valid is False
        assert result.error_code == "SIGNATURE_EXPIRED"

    def test_verify_request_invalid_timestamp(self, verifier):
        """Test verification fails with invalid timestamp."""
        result = verifier.verify_request(
            headers={
                "X-AgentID-Credential": "cred_123",
                "X-AgentID-Timestamp": "not_a_number",
                "X-AgentID-Signature": "sig_abc",
            },
            method="GET",
            url="https://api.example.com/data",
        )

        assert result.valid is False
        assert result.error_code == "INVALID_TIMESTAMP"


class TestCheckPermission:
    """Tests for permission checking."""

    def test_simple_string_permission_match(self):
        """Test matching simple string permissions."""
        permissions = ["read", "write"]

        result = check_permission(
            permissions,
            resource="any",
            action="read",
        )
        assert result["granted"] is True

    def test_simple_string_permission_no_match(self):
        """Test non-matching string permissions."""
        permissions = ["read"]

        result = check_permission(
            permissions,
            resource="any",
            action="write",
        )
        assert result["granted"] is False

    def test_wildcard_permission(self):
        """Test wildcard permission matches all."""
        permissions = ["*"]

        result = check_permission(
            permissions,
            resource="any",
            action="delete",
        )
        assert result["granted"] is True

    def test_structured_permission_resource_match(self):
        """Test structured permission with resource matching."""
        permissions = [
            {
                "resource": "https://api.example.com/users/*",
                "actions": ["read", "write"],
            }
        ]

        result = check_permission(
            permissions,
            resource="https://api.example.com/users/123",
            action="read",
        )
        assert result["granted"] is True

    def test_structured_permission_resource_no_match(self):
        """Test structured permission with non-matching resource."""
        permissions = [
            {
                "resource": "https://api.example.com/users/*",
                "actions": ["read"],
            }
        ]

        result = check_permission(
            permissions,
            resource="https://api.example.com/admin/settings",
            action="read",
        )
        assert result["granted"] is False

    def test_structured_permission_action_no_match(self):
        """Test structured permission with non-matching action."""
        permissions = [
            {
                "resource": "https://api.example.com/users/*",
                "actions": ["read"],
            }
        ]

        result = check_permission(
            permissions,
            resource="https://api.example.com/users/123",
            action="write",
        )
        assert result["granted"] is False

    def test_structured_permission_with_conditions(self):
        """Test permission conditions."""
        permissions = [
            {
                "resource": "https://api.example.com/payments/*",
                "actions": ["write"],
                "conditions": {
                    "max_transaction_amount": 10000,
                },
            }
        ]

        # Within limit
        result = check_permission(
            permissions,
            resource="https://api.example.com/payments/new",
            action="write",
            context={"amount": 5000},
        )
        assert result["granted"] is True

        # Exceeds limit
        result = check_permission(
            permissions,
            resource="https://api.example.com/payments/new",
            action="write",
            context={"amount": 50000},
        )
        assert result["granted"] is False
        assert "exceeds limit" in result["reason"].lower()

    def test_structured_permission_region_restriction(self):
        """Test region restriction."""
        permissions = [
            {
                "resource": "https://api.example.com/*",
                "actions": ["read"],
                "conditions": {
                    "allowed_regions": ["US", "EU"],
                },
            }
        ]

        # Allowed region
        result = check_permission(
            permissions,
            resource="https://api.example.com/data",
            action="read",
            context={"region": "US"},
        )
        assert result["granted"] is True

        # Disallowed region
        result = check_permission(
            permissions,
            resource="https://api.example.com/data",
            action="read",
            context={"region": "CN"},
        )
        assert result["granted"] is False
        assert "not allowed" in result["reason"].lower()

    def test_multiple_permissions(self):
        """Test matching against multiple permissions."""
        permissions = [
            {
                "resource": "https://api.example.com/users/*",
                "actions": ["read"],
            },
            {
                "resource": "https://api.example.com/admin/*",
                "actions": ["read", "write"],
            },
        ]

        # First permission matches
        result = check_permission(
            permissions,
            resource="https://api.example.com/users/123",
            action="read",
        )
        assert result["granted"] is True

        # Second permission matches
        result = check_permission(
            permissions,
            resource="https://api.example.com/admin/settings",
            action="write",
        )
        assert result["granted"] is True

        # Neither matches
        result = check_permission(
            permissions,
            resource="https://api.example.com/users/123",
            action="write",  # First only allows read
        )
        assert result["granted"] is False

    def test_permission_object(self):
        """Test with Permission objects."""
        from agentid.types import Permission, PermissionConditions

        permissions = [
            Permission(
                resource="https://api.example.com/*",
                actions=["read", "write"],
                conditions=PermissionConditions(
                    max_transaction_amount=1000,
                ),
            )
        ]

        result = check_permission(
            permissions,
            resource="https://api.example.com/data",
            action="read",
        )
        assert result["granted"] is True
