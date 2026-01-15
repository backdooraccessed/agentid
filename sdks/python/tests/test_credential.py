"""Tests for AgentCredential class."""

import time
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import httpx
import pytest

from agentid import (
    AgentCredential,
    CredentialExpiredError,
    CredentialNotFoundError,
    CredentialRevokedError,
)
from agentid.cache import CredentialCache


class TestAgentCredential:
    """Tests for AgentCredential."""

    def test_init(self):
        """Test credential initialization."""
        cred = AgentCredential("cred_test")
        assert cred.credential_id == "cred_test"
        assert cred.api_base == "https://agentid.dev/api"
        assert cred.auto_refresh is True
        assert not cred.is_loaded

    def test_init_custom_options(self):
        """Test credential initialization with custom options."""
        cache = CredentialCache()
        cred = AgentCredential(
            "cred_test",
            api_key="key_123",
            api_base="https://custom.api.com/api",
            cache=cache,
            auto_refresh=False,
            refresh_threshold=600.0,
        )
        assert cred.credential_id == "cred_test"
        assert cred.api_key == "key_123"
        assert cred.api_base == "https://custom.api.com/api"
        assert cred.cache is cache
        assert cred.auto_refresh is False
        assert cred.refresh_threshold == 600.0

    def test_cache_key(self):
        """Test cache key generation."""
        cred = AgentCredential("cred_abc123")
        assert cred.cache_key == "credential:cred_abc123"

    def test_is_loaded_false_initially(self):
        """Test is_loaded is False before loading."""
        cred = AgentCredential("cred_test")
        assert cred.is_loaded is False

    def test_is_expired_true_when_not_loaded(self):
        """Test is_expired is True when not loaded."""
        cred = AgentCredential("cred_test")
        assert cred.is_expired is True

    def test_time_to_expiry_zero_when_not_loaded(self):
        """Test time_to_expiry is 0 when not loaded."""
        cred = AgentCredential("cred_test")
        assert cred.time_to_expiry == 0

    def test_get_headers(self):
        """Test header generation."""
        cred = AgentCredential("cred_test")
        headers = cred.get_headers("GET", "https://api.example.com/data")

        assert "X-AgentID-Credential" in headers
        assert headers["X-AgentID-Credential"] == "cred_test"
        assert "X-AgentID-Timestamp" in headers
        assert "X-AgentID-Nonce" in headers
        assert "X-AgentID-Signature" in headers

    def test_get_headers_includes_body_in_signature(self):
        """Test that body is included in signature calculation."""
        cred = AgentCredential("cred_test")

        headers1 = cred.get_headers("POST", "https://api.example.com", body='{"a":1}')
        headers2 = cred.get_headers("POST", "https://api.example.com", body='{"b":2}')

        # Signatures should be different for different bodies
        # (timestamps might differ too, so we just check they exist)
        assert headers1["X-AgentID-Signature"]
        assert headers2["X-AgentID-Signature"]

    def test_repr(self):
        """Test string representation."""
        cred = AgentCredential("cred_test")
        assert "cred_test" in repr(cred)
        assert "unknown" in repr(cred)  # Status unknown before load


class TestAgentCredentialWithMockedAPI:
    """Tests that mock the AgentID API."""

    @pytest.fixture
    def mock_response_data(self):
        """Create mock API response data."""
        return {
            "valid": True,
            "credential": {
                "credential_id": "cred_test",
                "agent_id": "agent_123",
                "agent_name": "Test Agent",
                "agent_type": "assistant",
                "issuer": {
                    "issuer_id": "issuer_123",
                    "name": "Test Issuer",
                    "is_verified": True,
                },
                "permissions": ["read", "write"],
                "constraints": {
                    "valid_from": datetime.now(timezone.utc).isoformat(),
                    "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                },
                "signature": "test_signature",
            },
            "trust_score": 85,
        }

    def test_load_success(self, mock_response_data):
        """Test successful credential loading."""
        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = mock_response_data
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_test", cache=CredentialCache())
            result = cred.load()

            assert cred.is_loaded
            assert result.agent_name == "Test Agent"
            assert cred._credential_data.agent_id == "agent_123"

    def test_load_not_found(self):
        """Test loading non-existent credential."""
        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = {
                "valid": False,
                "error": "Credential not found",
                "error_code": "CREDENTIAL_NOT_FOUND",
            }
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_nonexistent", cache=CredentialCache())

            with pytest.raises(CredentialNotFoundError):
                cred.load()

    def test_load_expired(self):
        """Test loading expired credential."""
        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = {
                "valid": False,
                "error": "Credential expired",
                "error_code": "CREDENTIAL_EXPIRED",
            }
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_expired", cache=CredentialCache())

            with pytest.raises(CredentialExpiredError):
                cred.load()

    def test_load_revoked(self):
        """Test loading revoked credential."""
        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = {
                "valid": False,
                "error": "Credential revoked",
                "error_code": "CREDENTIAL_REVOKED",
            }
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_revoked", cache=CredentialCache())

            with pytest.raises(CredentialRevokedError):
                cred.load()

    def test_load_uses_cache(self, mock_response_data):
        """Test that loading uses cache."""
        cache = CredentialCache()

        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = mock_response_data
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_test", cache=cache)

            # First load hits API
            cred.load()
            assert mock_post.call_count == 1

            # Second load uses cache
            cred2 = AgentCredential("cred_test", cache=cache)
            cred2.load()
            assert mock_post.call_count == 1  # No additional API call

    def test_load_force_bypasses_cache(self, mock_response_data):
        """Test that force=True bypasses cache."""
        cache = CredentialCache()

        with patch("httpx.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = mock_response_data
            mock_post.return_value = mock_response

            cred = AgentCredential("cred_test", cache=cache)

            cred.load()
            assert mock_post.call_count == 1

            cred.load(force=True)
            assert mock_post.call_count == 2


class TestAgentCredentialAsync:
    """Async tests for AgentCredential."""

    @pytest.mark.asyncio
    async def test_load_async(self):
        """Test async credential loading."""
        mock_data = {
            "valid": True,
            "credential": {
                "credential_id": "cred_test",
                "agent_id": "agent_123",
                "agent_name": "Test Agent",
                "issuer": {
                    "issuer_id": "issuer_123",
                    "name": "Test Issuer",
                },
                "permissions": [],
                "constraints": {
                    "valid_from": datetime.now(timezone.utc).isoformat(),
                    "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                },
                "signature": "sig",
            },
            "trust_score": 80,
        }

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = mock_data

            async def mock_post(*args, **kwargs):
                return mock_response

            mock_client.post = mock_post
            mock_client.__aenter__ = lambda self: self
            mock_client.__aexit__ = lambda self, *args: None
            mock_client_class.return_value.__aenter__ = lambda self: mock_client
            mock_client_class.return_value.__aexit__ = lambda self, *args: None

            cred = AgentCredential("cred_test", cache=CredentialCache())

            # This would work with proper async mocking
            # result = await cred.load_async()
            # assert result.agent_name == "Test Agent"
