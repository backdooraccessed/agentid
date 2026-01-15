"""Core credential handling for AgentID SDK."""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Callable

import httpx

from agentid.cache import CredentialCache, get_global_cache
from agentid.exceptions import (
    AgentIDError,
    AuthenticationError,
    CredentialExpiredError,
    CredentialInvalidError,
    CredentialNotFoundError,
    CredentialRevokedError,
    NetworkError,
    RateLimitError,
)
from agentid.signature import RequestSigner
from agentid.types import (
    CredentialPayload,
    CredentialStatus,
    ReputationInfo,
    VerificationResult,
)

# Default AgentID API base URL
DEFAULT_API_BASE = "https://agentid.dev/api"


class AgentCredential:
    """
    An AI agent's credential for authentication and authorization.

    This class handles:
    - Loading and caching credential data
    - Signing HTTP requests with the credential
    - Auto-renewal before expiration
    - Wrapping HTTP clients (httpx, requests)

    Usage:
        # Basic usage
        cred = AgentCredential("cred_xxx")
        response = await cred.request("https://api.example.com/data")

        # With custom API key (for private credentials)
        cred = AgentCredential("cred_xxx", api_key="key_xxx")

        # Wrap an existing httpx client
        client = cred.wrap_httpx(httpx.AsyncClient())
        response = await client.get("https://api.example.com/data")
    """

    def __init__(
        self,
        credential_id: str,
        *,
        api_key: str | None = None,
        api_base: str = DEFAULT_API_BASE,
        cache: CredentialCache | None = None,
        auto_refresh: bool = True,
        refresh_threshold: float = 300.0,  # Refresh 5 min before expiry
        signing_secret: str | None = None,
    ) -> None:
        """
        Initialize an AgentCredential.

        Args:
            credential_id: The credential ID (e.g., "cred_xxx")
            api_key: Optional API key for accessing private credentials
            api_base: Base URL for AgentID API
            cache: Optional cache instance (uses global cache if not provided)
            auto_refresh: Automatically refresh credentials before expiry
            refresh_threshold: Seconds before expiry to trigger refresh
            signing_secret: Optional secret for request signing
        """
        self.credential_id = credential_id
        self.api_key = api_key
        self.api_base = api_base.rstrip("/")
        self.cache = cache or get_global_cache()
        self.auto_refresh = auto_refresh
        self.refresh_threshold = refresh_threshold

        self._signer = RequestSigner(
            credential_id=credential_id,
            signing_secret=signing_secret,
        )

        self._credential_data: CredentialPayload | None = None
        self._reputation_data: ReputationInfo | None = None
        self._last_fetch: float = 0
        self._status: CredentialStatus | None = None

    @property
    def cache_key(self) -> str:
        """Get the cache key for this credential."""
        return f"credential:{self.credential_id}"

    @property
    def is_loaded(self) -> bool:
        """Check if credential data has been loaded."""
        return self._credential_data is not None

    @property
    def is_expired(self) -> bool:
        """Check if the credential has expired."""
        if not self._credential_data:
            return True
        now = datetime.now(timezone.utc)
        return now >= self._credential_data.constraints.valid_until

    @property
    def is_active(self) -> bool:
        """Check if the credential is active and valid."""
        return self._status == CredentialStatus.ACTIVE and not self.is_expired

    @property
    def time_to_expiry(self) -> float:
        """Get seconds until credential expires."""
        if not self._credential_data:
            return 0
        now = datetime.now(timezone.utc)
        delta = self._credential_data.constraints.valid_until - now
        return max(0, delta.total_seconds())

    @property
    def needs_refresh(self) -> bool:
        """Check if the credential should be refreshed."""
        return self.time_to_expiry < self.refresh_threshold

    def _get_api_headers(self) -> dict[str, str]:
        """Get headers for AgentID API requests."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "agentid-python/0.1.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _fetch_credential_async(self) -> VerificationResult:
        """Fetch credential data from the API (async)."""
        url = f"{self.api_base}/verify"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    json={"credential_id": self.credential_id},
                    headers=self._get_api_headers(),
                    timeout=30.0,
                )
            except httpx.RequestError as e:
                raise NetworkError(f"Failed to connect to AgentID API: {e}") from e

        return self._handle_verify_response(response)

    def _fetch_credential_sync(self) -> VerificationResult:
        """Fetch credential data from the API (sync)."""
        url = f"{self.api_base}/verify"

        try:
            response = httpx.post(
                url,
                json={"credential_id": self.credential_id},
                headers=self._get_api_headers(),
                timeout=30.0,
            )
        except httpx.RequestError as e:
            raise NetworkError(f"Failed to connect to AgentID API: {e}") from e

        return self._handle_verify_response(response)

    def _handle_verify_response(self, response: httpx.Response) -> VerificationResult:
        """Handle the verification API response."""
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            raise RateLimitError(
                "Rate limit exceeded",
                retry_after=int(retry_after) if retry_after else None,
            )

        if response.status_code == 401:
            raise AuthenticationError("Invalid API key")

        try:
            data = response.json()
        except Exception as e:
            raise AgentIDError(f"Invalid response from API: {e}") from e

        if response.status_code == 404 or data.get("error_code") == "CREDENTIAL_NOT_FOUND":
            raise CredentialNotFoundError(
                f"Credential not found: {self.credential_id}"
            )

        if not response.is_success:
            error = data.get("error", "Unknown error")
            error_code = data.get("error_code")
            raise AgentIDError(error, details={"error_code": error_code})

        return VerificationResult(**data)

    def _update_from_result(self, result: VerificationResult) -> None:
        """Update internal state from verification result."""
        if not result.valid:
            error_code = result.error_code
            if error_code == "CREDENTIAL_EXPIRED":
                self._status = CredentialStatus.EXPIRED
                raise CredentialExpiredError(result.error or "Credential expired")
            elif error_code == "CREDENTIAL_REVOKED":
                self._status = CredentialStatus.REVOKED
                raise CredentialRevokedError(result.error or "Credential revoked")
            else:
                raise CredentialInvalidError(result.error or "Credential invalid")

        self._credential_data = result.credential
        self._status = CredentialStatus.ACTIVE
        self._last_fetch = time.time()

        # Cache the credential data
        if self._credential_data:
            ttl = min(self.time_to_expiry, 3600)  # Max 1 hour cache
            self.cache.set(
                self.cache_key,
                self._credential_data.model_dump(),
                ttl=ttl,
            )

    async def load_async(self, force: bool = False) -> CredentialPayload:
        """
        Load credential data (async).

        Args:
            force: Force refresh even if cached

        Returns:
            The credential payload

        Raises:
            CredentialNotFoundError: If credential doesn't exist
            CredentialExpiredError: If credential has expired
            CredentialRevokedError: If credential has been revoked
        """
        # Check cache first
        if not force:
            cached = self.cache.get(self.cache_key)
            if cached:
                self._credential_data = CredentialPayload(**cached)
                self._status = CredentialStatus.ACTIVE
                if not self.needs_refresh:
                    return self._credential_data

        # Fetch from API
        result = await self._fetch_credential_async()
        self._update_from_result(result)

        if not self._credential_data:
            raise CredentialInvalidError("No credential data returned")

        return self._credential_data

    def load(self, force: bool = False) -> CredentialPayload:
        """
        Load credential data (sync).

        Args:
            force: Force refresh even if cached

        Returns:
            The credential payload
        """
        # Check cache first
        if not force:
            cached = self.cache.get(self.cache_key)
            if cached:
                self._credential_data = CredentialPayload(**cached)
                self._status = CredentialStatus.ACTIVE
                if not self.needs_refresh:
                    return self._credential_data

        # Fetch from API
        result = self._fetch_credential_sync()
        self._update_from_result(result)

        if not self._credential_data:
            raise CredentialInvalidError("No credential data returned")

        return self._credential_data

    def get_headers(
        self,
        method: str = "GET",
        url: str = "",
        body: str | bytes | None = None,
    ) -> dict[str, str]:
        """
        Get headers to include in a request.

        This generates the authentication headers that should be
        included in HTTP requests to services that verify AgentID credentials.

        Args:
            method: HTTP method
            url: Request URL
            body: Request body (for signature)

        Returns:
            Dictionary of headers
        """
        return self._signer.sign_request(method, url, body)

    async def request_async(
        self,
        url: str,
        method: str = "GET",
        **kwargs: Any,
    ) -> httpx.Response:
        """
        Make an HTTP request with credential headers (async).

        Args:
            url: The URL to request
            method: HTTP method
            **kwargs: Additional arguments passed to httpx

        Returns:
            The HTTP response
        """
        # Ensure credential is loaded
        if not self.is_loaded or (self.auto_refresh and self.needs_refresh):
            await self.load_async()

        # Get body for signature
        body = kwargs.get("content") or kwargs.get("json")
        if isinstance(body, dict):
            import json
            body = json.dumps(body)

        # Add credential headers
        headers = kwargs.pop("headers", {})
        headers.update(self.get_headers(method, url, body))

        async with httpx.AsyncClient() as client:
            return await client.request(method, url, headers=headers, **kwargs)

    def request(
        self,
        url: str,
        method: str = "GET",
        **kwargs: Any,
    ) -> httpx.Response:
        """
        Make an HTTP request with credential headers (sync).

        Args:
            url: The URL to request
            method: HTTP method
            **kwargs: Additional arguments passed to httpx

        Returns:
            The HTTP response
        """
        # Ensure credential is loaded
        if not self.is_loaded or (self.auto_refresh and self.needs_refresh):
            self.load()

        # Get body for signature
        body = kwargs.get("content") or kwargs.get("json")
        if isinstance(body, dict):
            import json
            body = json.dumps(body)

        # Add credential headers
        headers = kwargs.pop("headers", {})
        headers.update(self.get_headers(method, url, body))

        return httpx.request(method, url, headers=headers, **kwargs)

    def wrap_httpx(
        self,
        client: httpx.AsyncClient | httpx.Client,
    ) -> httpx.AsyncClient | httpx.Client:
        """
        Wrap an httpx client to automatically include credential headers.

        Args:
            client: The httpx client to wrap

        Returns:
            The wrapped client
        """
        original_send = client.send

        credential = self

        if isinstance(client, httpx.AsyncClient):
            async def send_with_auth(
                request: httpx.Request,
                **kwargs: Any,
            ) -> httpx.Response:
                # Refresh if needed
                if credential.auto_refresh and credential.needs_refresh:
                    await credential.load_async()

                # Add headers
                body = request.content if request.content else None
                headers = credential.get_headers(
                    request.method,
                    str(request.url),
                    body,
                )
                for key, value in headers.items():
                    request.headers[key] = value

                return await original_send(request, **kwargs)

            client.send = send_with_auth  # type: ignore
        else:
            def send_with_auth_sync(
                request: httpx.Request,
                **kwargs: Any,
            ) -> httpx.Response:
                # Refresh if needed
                if credential.auto_refresh and credential.needs_refresh:
                    credential.load()

                # Add headers
                body = request.content if request.content else None
                headers = credential.get_headers(
                    request.method,
                    str(request.url),
                    body,
                )
                for key, value in headers.items():
                    request.headers[key] = value

                return original_send(request, **kwargs)

            client.send = send_with_auth_sync  # type: ignore

        return client

    def __repr__(self) -> str:
        status = self._status.value if self._status else "unknown"
        return f"AgentCredential(id={self.credential_id!r}, status={status})"


# Convenience function for one-off requests
async def agent_request(
    credential_id: str,
    url: str,
    method: str = "GET",
    **kwargs: Any,
) -> httpx.Response:
    """
    Make a single request with an agent credential.

    This is a convenience function for one-off requests. For multiple
    requests, create an AgentCredential instance and reuse it.

    Args:
        credential_id: The credential ID
        url: The URL to request
        method: HTTP method
        **kwargs: Additional arguments

    Returns:
        The HTTP response
    """
    cred = AgentCredential(credential_id)
    return await cred.request_async(url, method, **kwargs)
