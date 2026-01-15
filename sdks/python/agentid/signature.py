"""Cryptographic signature utilities for AgentID."""

import base64
import hashlib
import hmac
import json
import time
from typing import Any

from agentid.exceptions import SignatureError


def canonical_json(obj: Any) -> str:
    """
    Convert object to canonical JSON string.

    Keys are sorted alphabetically for consistent hashing.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def generate_request_signature(
    method: str,
    url: str,
    body: str | bytes | None,
    timestamp: int,
    credential_id: str,
    secret: str | None = None,
) -> str:
    """
    Generate a signature for an HTTP request.

    The signature proves the request came from the credential holder
    and hasn't been tampered with.

    Args:
        method: HTTP method (GET, POST, etc.)
        url: Full request URL
        body: Request body (if any)
        timestamp: Unix timestamp of the request
        credential_id: The credential ID
        secret: Optional secret for HMAC (if not using Ed25519)

    Returns:
        Base64-encoded signature string
    """
    # Build the signing payload
    body_hash = ""
    if body:
        if isinstance(body, str):
            body = body.encode("utf-8")
        body_hash = hashlib.sha256(body).hexdigest()

    signing_string = f"{method.upper()}\n{url}\n{timestamp}\n{credential_id}\n{body_hash}"

    if secret:
        # HMAC-SHA256 signature
        signature = hmac.new(
            secret.encode("utf-8"),
            signing_string.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    else:
        # Simple SHA256 hash (for verification without secret)
        signature = hashlib.sha256(signing_string.encode("utf-8")).digest()

    return base64.b64encode(signature).decode("utf-8")


def verify_request_signature(
    signature: str,
    method: str,
    url: str,
    body: str | bytes | None,
    timestamp: int,
    credential_id: str,
    secret: str,
    max_age_seconds: int = 300,
) -> bool:
    """
    Verify a request signature.

    Args:
        signature: The signature to verify
        method: HTTP method
        url: Full request URL
        body: Request body
        timestamp: Unix timestamp from the request
        credential_id: The credential ID
        secret: The secret used for signing
        max_age_seconds: Maximum age of the request (default 5 minutes)

    Returns:
        True if signature is valid, False otherwise

    Raises:
        SignatureError: If the timestamp is too old
    """
    # Check timestamp freshness
    current_time = int(time.time())
    if abs(current_time - timestamp) > max_age_seconds:
        raise SignatureError(f"Request timestamp too old (max age: {max_age_seconds}s)")

    # Generate expected signature
    expected = generate_request_signature(
        method=method,
        url=url,
        body=body,
        timestamp=timestamp,
        credential_id=credential_id,
        secret=secret,
    )

    # Constant-time comparison
    return hmac.compare_digest(signature, expected)


def generate_nonce() -> str:
    """Generate a random nonce for request uniqueness."""
    import secrets

    return secrets.token_urlsafe(16)


class RequestSigner:
    """
    Signs HTTP requests with AgentID credentials.

    This class maintains state for signing requests and can be
    configured with different signing strategies.
    """

    def __init__(
        self,
        credential_id: str,
        signing_secret: str | None = None,
    ) -> None:
        """
        Initialize the request signer.

        Args:
            credential_id: The credential ID to sign requests with
            signing_secret: Optional secret for HMAC signing
        """
        self.credential_id = credential_id
        self.signing_secret = signing_secret

    def sign_request(
        self,
        method: str,
        url: str,
        body: str | bytes | None = None,
    ) -> dict[str, str]:
        """
        Sign a request and return headers to include.

        Args:
            method: HTTP method
            url: Full request URL
            body: Optional request body

        Returns:
            Dictionary of headers to include in the request
        """
        timestamp = int(time.time())
        nonce = generate_nonce()

        signature = generate_request_signature(
            method=method,
            url=url,
            body=body,
            timestamp=timestamp,
            credential_id=self.credential_id,
            secret=self.signing_secret,
        )

        return {
            "X-AgentID-Credential": self.credential_id,
            "X-AgentID-Timestamp": str(timestamp),
            "X-AgentID-Nonce": nonce,
            "X-AgentID-Signature": signature,
        }
