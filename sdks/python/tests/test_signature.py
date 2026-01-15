"""Tests for signature utilities."""

import time

import pytest

from agentid.signature import (
    RequestSigner,
    canonical_json,
    generate_nonce,
    generate_request_signature,
    verify_request_signature,
)
from agentid.exceptions import SignatureError


class TestCanonicalJson:
    """Tests for canonical JSON serialization."""

    def test_sorts_keys(self):
        """Test that keys are sorted."""
        obj = {"z": 1, "a": 2, "m": 3}
        result = canonical_json(obj)
        assert result == '{"a":2,"m":3,"z":1}'

    def test_nested_objects(self):
        """Test nested object key sorting."""
        obj = {"b": {"z": 1, "a": 2}, "a": 1}
        result = canonical_json(obj)
        assert result == '{"a":1,"b":{"a":2,"z":1}}'

    def test_arrays(self):
        """Test array handling."""
        obj = {"items": [3, 1, 2]}
        result = canonical_json(obj)
        assert result == '{"items":[3,1,2]}'  # Arrays preserve order

    def test_no_whitespace(self):
        """Test no extra whitespace."""
        obj = {"key": "value", "number": 123}
        result = canonical_json(obj)
        assert " " not in result
        assert "\n" not in result


class TestGenerateRequestSignature:
    """Tests for request signature generation."""

    def test_generates_signature(self):
        """Test basic signature generation."""
        sig = generate_request_signature(
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
        )
        assert isinstance(sig, str)
        assert len(sig) > 0

    def test_different_methods_different_signatures(self):
        """Test that different methods produce different signatures."""
        sig1 = generate_request_signature(
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
        )
        sig2 = generate_request_signature(
            method="POST",
            url="https://api.example.com/data",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
        )
        assert sig1 != sig2

    def test_different_urls_different_signatures(self):
        """Test that different URLs produce different signatures."""
        sig1 = generate_request_signature(
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
        )
        sig2 = generate_request_signature(
            method="GET",
            url="https://api.example.com/other",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
        )
        assert sig1 != sig2

    def test_different_bodies_different_signatures(self):
        """Test that different bodies produce different signatures."""
        sig1 = generate_request_signature(
            method="POST",
            url="https://api.example.com/data",
            body='{"a": 1}',
            timestamp=1234567890,
            credential_id="cred_test",
        )
        sig2 = generate_request_signature(
            method="POST",
            url="https://api.example.com/data",
            body='{"b": 2}',
            timestamp=1234567890,
            credential_id="cred_test",
        )
        assert sig1 != sig2

    def test_with_secret(self):
        """Test signature with secret."""
        sig = generate_request_signature(
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=1234567890,
            credential_id="cred_test",
            secret="my_secret",
        )
        assert isinstance(sig, str)
        assert len(sig) > 0

    def test_same_inputs_same_signature(self):
        """Test deterministic signature generation."""
        kwargs = {
            "method": "POST",
            "url": "https://api.example.com/data",
            "body": '{"key": "value"}',
            "timestamp": 1234567890,
            "credential_id": "cred_test",
            "secret": "secret",
        }
        sig1 = generate_request_signature(**kwargs)
        sig2 = generate_request_signature(**kwargs)
        assert sig1 == sig2


class TestVerifyRequestSignature:
    """Tests for request signature verification."""

    def test_verify_valid_signature(self):
        """Test verifying a valid signature."""
        timestamp = int(time.time())
        secret = "test_secret"

        sig = generate_request_signature(
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=timestamp,
            credential_id="cred_test",
            secret=secret,
        )

        result = verify_request_signature(
            signature=sig,
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=timestamp,
            credential_id="cred_test",
            secret=secret,
        )
        assert result is True

    def test_reject_wrong_signature(self):
        """Test rejecting wrong signature."""
        timestamp = int(time.time())

        result = verify_request_signature(
            signature="wrong_signature",
            method="GET",
            url="https://api.example.com/data",
            body=None,
            timestamp=timestamp,
            credential_id="cred_test",
            secret="secret",
        )
        assert result is False

    def test_reject_old_timestamp(self):
        """Test rejecting old timestamps."""
        old_timestamp = int(time.time()) - 600  # 10 minutes ago

        with pytest.raises(SignatureError):
            verify_request_signature(
                signature="any",
                method="GET",
                url="https://api.example.com/data",
                body=None,
                timestamp=old_timestamp,
                credential_id="cred_test",
                secret="secret",
                max_age_seconds=300,
            )


class TestGenerateNonce:
    """Tests for nonce generation."""

    def test_generates_string(self):
        """Test nonce is a string."""
        nonce = generate_nonce()
        assert isinstance(nonce, str)

    def test_generates_unique_values(self):
        """Test nonces are unique."""
        nonces = [generate_nonce() for _ in range(100)]
        assert len(set(nonces)) == 100

    def test_reasonable_length(self):
        """Test nonce has reasonable length."""
        nonce = generate_nonce()
        assert 10 <= len(nonce) <= 50


class TestRequestSigner:
    """Tests for RequestSigner class."""

    def test_sign_request(self):
        """Test signing a request."""
        signer = RequestSigner("cred_test")
        headers = signer.sign_request("GET", "https://api.example.com/data")

        assert "X-AgentID-Credential" in headers
        assert headers["X-AgentID-Credential"] == "cred_test"
        assert "X-AgentID-Timestamp" in headers
        assert "X-AgentID-Nonce" in headers
        assert "X-AgentID-Signature" in headers

    def test_sign_request_with_body(self):
        """Test signing request with body."""
        signer = RequestSigner("cred_test")
        headers = signer.sign_request(
            "POST",
            "https://api.example.com/data",
            body='{"key": "value"}',
        )

        assert "X-AgentID-Signature" in headers

    def test_sign_request_with_secret(self):
        """Test signing with secret."""
        signer = RequestSigner("cred_test", signing_secret="secret")
        headers = signer.sign_request("GET", "https://api.example.com/data")

        assert "X-AgentID-Signature" in headers
