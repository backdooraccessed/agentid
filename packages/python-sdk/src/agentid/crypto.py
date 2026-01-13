"""
AgentID SDK Cryptographic Utilities

Ed25519 signature verification and JSON canonicalization.
"""

import base64
import json
from typing import Any

from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError


def base64_encode(data: bytes) -> str:
    """Encode bytes to base64 string."""
    return base64.b64encode(data).decode("ascii")


def base64_decode(data: str) -> bytes:
    """Decode base64 string to bytes."""
    return base64.b64decode(data)


def canonical_json(obj: Any) -> str:
    """
    Create canonical JSON with sorted keys for deterministic hashing.

    This matches the JavaScript implementation to ensure signature compatibility.
    """
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, (int, float)):
        return json.dumps(obj)
    if isinstance(obj, str):
        return json.dumps(obj)
    if isinstance(obj, list):
        items = [canonical_json(item) for item in obj]
        return "[" + ",".join(items) + "]"
    if isinstance(obj, dict):
        keys = sorted(obj.keys())
        pairs = [f"{json.dumps(key)}:{canonical_json(obj[key])}" for key in keys]
        return "{" + ",".join(pairs) + "}"
    return json.dumps(obj)


def verify_signature(
    payload: dict[str, Any],
    signature: str,
    public_key: str,
) -> bool:
    """
    Verify an Ed25519 signature on a credential payload.

    Args:
        payload: The credential payload (without the signature field)
        signature: Base64-encoded Ed25519 signature
        public_key: Base64-encoded Ed25519 public key

    Returns:
        True if the signature is valid, False otherwise
    """
    try:
        # Remove signature from payload if present
        payload_without_sig = {k: v for k, v in payload.items() if k != "signature"}

        # Create canonical JSON message
        message = canonical_json(payload_without_sig).encode("utf-8")

        # Decode signature and public key
        sig_bytes = base64_decode(signature)
        key_bytes = base64_decode(public_key)

        # Verify using PyNaCl
        verify_key = VerifyKey(key_bytes)
        verify_key.verify(message, sig_bytes)

        return True
    except (BadSignatureError, ValueError, Exception):
        return False
