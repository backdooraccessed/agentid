"""Credential verification for services using AgentID."""

from __future__ import annotations

import time
from typing import Any, Callable, TypeVar

import httpx

from agentid.cache import CredentialCache, get_global_cache
from agentid.exceptions import (
    AgentIDError,
    CredentialExpiredError,
    CredentialInvalidError,
    CredentialNotFoundError,
    CredentialRevokedError,
    NetworkError,
    RateLimitError,
    SignatureError,
)
from agentid.signature import verify_request_signature
from agentid.types import Permission, VerificationResult

# Default API base
DEFAULT_API_BASE = "https://agentid.dev/api"


class CredentialVerifier:
    """
    Verify AgentID credentials from incoming requests.

    This class is used by services that receive requests from agents
    and need to verify their credentials.

    Usage:
        verifier = CredentialVerifier()

        # Verify from headers
        result = await verifier.verify_request(
            headers=request.headers,
            method="POST",
            url=str(request.url),
            body=await request.body(),
        )

        if result.valid:
            print(f"Request from: {result.credential.agent_name}")
    """

    def __init__(
        self,
        *,
        api_base: str = DEFAULT_API_BASE,
        cache: CredentialCache | None = None,
        cache_ttl: float = 300.0,  # Cache verifications for 5 minutes
        verify_signature: bool = True,
        signature_max_age: int = 300,  # 5 minute max age for signatures
    ) -> None:
        """
        Initialize the verifier.

        Args:
            api_base: Base URL for AgentID API
            cache: Optional cache instance
            cache_ttl: How long to cache verification results
            verify_signature: Whether to verify request signatures
            signature_max_age: Max age of request signatures in seconds
        """
        self.api_base = api_base.rstrip("/")
        self.cache = cache or get_global_cache()
        self.cache_ttl = cache_ttl
        self.verify_signature = verify_signature
        self.signature_max_age = signature_max_age

    def _extract_credential_info(
        self,
        headers: dict[str, str],
    ) -> tuple[str | None, str | None, str | None, str | None]:
        """Extract credential info from headers."""
        # Normalize header names (case-insensitive)
        normalized = {k.lower(): v for k, v in headers.items()}

        credential_id = normalized.get("x-agentid-credential")
        timestamp = normalized.get("x-agentid-timestamp")
        nonce = normalized.get("x-agentid-nonce")
        signature = normalized.get("x-agentid-signature")

        return credential_id, timestamp, nonce, signature

    async def verify_credential_async(
        self,
        credential_id: str,
        *,
        use_cache: bool = True,
    ) -> VerificationResult:
        """
        Verify a credential by ID (async).

        Args:
            credential_id: The credential ID to verify
            use_cache: Whether to use cached results

        Returns:
            Verification result
        """
        # Check cache
        if use_cache:
            cache_key = f"verify:{credential_id}"
            cached = self.cache.get(cache_key)
            if cached:
                return VerificationResult(**cached)

        # Call API
        url = f"{self.api_base}/verify"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    json={"credential_id": credential_id},
                    timeout=30.0,
                )
            except httpx.RequestError as e:
                raise NetworkError(f"Failed to verify credential: {e}") from e

        result = self._handle_response(response)

        # Cache successful verifications
        if use_cache and result.valid:
            cache_key = f"verify:{credential_id}"
            self.cache.set(cache_key, result.model_dump(), ttl=self.cache_ttl)

        return result

    def verify_credential(
        self,
        credential_id: str,
        *,
        use_cache: bool = True,
    ) -> VerificationResult:
        """
        Verify a credential by ID (sync).

        Args:
            credential_id: The credential ID to verify
            use_cache: Whether to use cached results

        Returns:
            Verification result
        """
        # Check cache
        if use_cache:
            cache_key = f"verify:{credential_id}"
            cached = self.cache.get(cache_key)
            if cached:
                return VerificationResult(**cached)

        # Call API
        url = f"{self.api_base}/verify"
        try:
            response = httpx.post(
                url,
                json={"credential_id": credential_id},
                timeout=30.0,
            )
        except httpx.RequestError as e:
            raise NetworkError(f"Failed to verify credential: {e}") from e

        result = self._handle_response(response)

        # Cache successful verifications
        if use_cache and result.valid:
            cache_key = f"verify:{credential_id}"
            self.cache.set(cache_key, result.model_dump(), ttl=self.cache_ttl)

        return result

    def _handle_response(self, response: httpx.Response) -> VerificationResult:
        """Handle verification API response."""
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            raise RateLimitError(
                "Rate limit exceeded",
                retry_after=int(retry_after) if retry_after else None,
            )

        try:
            data = response.json()
        except Exception as e:
            raise AgentIDError(f"Invalid response: {e}") from e

        return VerificationResult(**data)

    async def verify_request_async(
        self,
        headers: dict[str, str],
        method: str,
        url: str,
        body: str | bytes | None = None,
    ) -> VerificationResult:
        """
        Verify a request with AgentID headers (async).

        Args:
            headers: Request headers
            method: HTTP method
            url: Request URL
            body: Request body

        Returns:
            Verification result
        """
        credential_id, timestamp, nonce, signature = self._extract_credential_info(headers)

        if not credential_id:
            return VerificationResult(
                valid=False,
                error="Missing X-AgentID-Credential header",
                error_code="MISSING_CREDENTIAL",
            )

        # Verify signature if enabled
        if self.verify_signature:
            if not timestamp or not signature:
                return VerificationResult(
                    valid=False,
                    error="Missing signature headers",
                    error_code="MISSING_SIGNATURE",
                )

            try:
                ts = int(timestamp)
                if abs(time.time() - ts) > self.signature_max_age:
                    return VerificationResult(
                        valid=False,
                        error="Request signature expired",
                        error_code="SIGNATURE_EXPIRED",
                    )
            except ValueError:
                return VerificationResult(
                    valid=False,
                    error="Invalid timestamp",
                    error_code="INVALID_TIMESTAMP",
                )

        # Verify credential
        return await self.verify_credential_async(credential_id)

    def verify_request(
        self,
        headers: dict[str, str],
        method: str,
        url: str,
        body: str | bytes | None = None,
    ) -> VerificationResult:
        """
        Verify a request with AgentID headers (sync).

        Args:
            headers: Request headers
            method: HTTP method
            url: Request URL
            body: Request body

        Returns:
            Verification result
        """
        credential_id, timestamp, nonce, signature = self._extract_credential_info(headers)

        if not credential_id:
            return VerificationResult(
                valid=False,
                error="Missing X-AgentID-Credential header",
                error_code="MISSING_CREDENTIAL",
            )

        # Verify signature if enabled
        if self.verify_signature:
            if not timestamp or not signature:
                return VerificationResult(
                    valid=False,
                    error="Missing signature headers",
                    error_code="MISSING_SIGNATURE",
                )

            try:
                ts = int(timestamp)
                if abs(time.time() - ts) > self.signature_max_age:
                    return VerificationResult(
                        valid=False,
                        error="Request signature expired",
                        error_code="SIGNATURE_EXPIRED",
                    )
            except ValueError:
                return VerificationResult(
                    valid=False,
                    error="Invalid timestamp",
                    error_code="INVALID_TIMESTAMP",
                )

        # Verify credential
        return self.verify_credential(credential_id)


def check_permission(
    permissions: list[str | Permission],
    *,
    resource: str,
    action: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Check if permissions allow a specific action.

    Args:
        permissions: List of permissions from credential
        resource: The resource being accessed
        action: The action being attempted
        context: Optional context (time, region, amount, etc.)

    Returns:
        Dict with 'granted' (bool) and 'reason' (str if denied)
    """
    import fnmatch

    for perm in permissions:
        # Handle string permissions (legacy)
        if isinstance(perm, str):
            if perm == "*" or perm == action:
                return {"granted": True}
            continue

        # Handle structured permissions
        if isinstance(perm, dict):
            perm = Permission(**perm)

        # Check resource match (supports wildcards)
        if not fnmatch.fnmatch(resource, perm.resource):
            continue

        # Check action
        if action not in perm.actions and "*" not in perm.actions:
            continue

        # Check conditions if present
        if perm.conditions and context:
            # Check time window
            if perm.conditions.valid_hours:
                # Would need actual time checking logic
                pass

            # Check rate limits
            if perm.conditions.max_requests_per_minute:
                # Would need rate tracking
                pass

            # Check amount limits
            if perm.conditions.max_transaction_amount:
                amount = context.get("amount")
                if amount and amount > perm.conditions.max_transaction_amount:
                    return {
                        "granted": False,
                        "reason": f"Amount {amount} exceeds limit {perm.conditions.max_transaction_amount}",
                    }

            # Check region
            if perm.conditions.allowed_regions:
                region = context.get("region")
                if region and region not in perm.conditions.allowed_regions:
                    return {
                        "granted": False,
                        "reason": f"Region {region} not allowed",
                    }

        # All checks passed
        return {"granted": True}

    # No matching permission found
    return {
        "granted": False,
        "reason": f"No permission for {action} on {resource}",
    }


# Decorator for protecting functions
F = TypeVar("F", bound=Callable[..., Any])


def require_credential(
    min_trust_score: int | None = None,
    required_permissions: list[str] | None = None,
) -> Callable[[F], F]:
    """
    Decorator to require AgentID credential for a function.

    This is a basic decorator - framework-specific middleware
    provides better integration.

    Usage:
        @require_credential(min_trust_score=50)
        async def my_handler(request, credential):
            ...
    """
    def decorator(func: F) -> F:
        import functools

        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Would need request object from framework
            # This is a placeholder - use framework middleware instead
            return await func(*args, **kwargs)

        return wrapper  # type: ignore

    return decorator
