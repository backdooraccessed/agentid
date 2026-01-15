"""HTTP client wrappers for AgentID SDK."""

from __future__ import annotations

from typing import Any

import httpx

from agentid.credential import AgentCredential


class AgentClient:
    """
    An HTTP client that automatically includes AgentID credentials.

    This is a high-level wrapper around httpx that handles credential
    management automatically.

    Usage:
        client = AgentClient("cred_xxx")

        # Async usage
        async with client:
            response = await client.get("https://api.example.com/data")

        # Sync usage
        with client.sync():
            response = client.get("https://api.example.com/data")
    """

    def __init__(
        self,
        credential_id: str,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
        **credential_kwargs: Any,
    ) -> None:
        """
        Initialize an AgentClient.

        Args:
            credential_id: The credential ID
            api_key: Optional API key for private credentials
            base_url: Optional base URL for all requests
            timeout: Request timeout in seconds
            **credential_kwargs: Additional arguments for AgentCredential
        """
        self.credential = AgentCredential(
            credential_id,
            api_key=api_key,
            **credential_kwargs,
        )
        self.base_url = base_url
        self.timeout = timeout
        self._async_client: httpx.AsyncClient | None = None
        self._sync_client: httpx.Client | None = None

    def _build_url(self, path: str) -> str:
        """Build full URL from path."""
        if path.startswith(("http://", "https://")):
            return path
        if self.base_url:
            return f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        return path

    async def __aenter__(self) -> AgentClient:
        """Enter async context."""
        self._async_client = httpx.AsyncClient(timeout=self.timeout)
        self.credential.wrap_httpx(self._async_client)
        await self.credential.load_async()
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Exit async context."""
        if self._async_client:
            await self._async_client.aclose()
            self._async_client = None

    def sync(self) -> AgentClient:
        """Get a sync context manager."""
        return _SyncClientContext(self)

    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a GET request."""
        if not self._async_client:
            return await self.credential.request_async(
                self._build_url(url), "GET", **kwargs
            )
        return await self._async_client.get(self._build_url(url), **kwargs)

    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a POST request."""
        if not self._async_client:
            return await self.credential.request_async(
                self._build_url(url), "POST", **kwargs
            )
        return await self._async_client.post(self._build_url(url), **kwargs)

    async def put(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a PUT request."""
        if not self._async_client:
            return await self.credential.request_async(
                self._build_url(url), "PUT", **kwargs
            )
        return await self._async_client.put(self._build_url(url), **kwargs)

    async def patch(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a PATCH request."""
        if not self._async_client:
            return await self.credential.request_async(
                self._build_url(url), "PATCH", **kwargs
            )
        return await self._async_client.patch(self._build_url(url), **kwargs)

    async def delete(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a DELETE request."""
        if not self._async_client:
            return await self.credential.request_async(
                self._build_url(url), "DELETE", **kwargs
            )
        return await self._async_client.delete(self._build_url(url), **kwargs)

    # Sync methods (used when in sync context)
    def get_sync(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a sync GET request."""
        if not self._sync_client:
            return self.credential.request(self._build_url(url), "GET", **kwargs)
        return self._sync_client.get(self._build_url(url), **kwargs)

    def post_sync(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a sync POST request."""
        if not self._sync_client:
            return self.credential.request(self._build_url(url), "POST", **kwargs)
        return self._sync_client.post(self._build_url(url), **kwargs)

    def put_sync(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a sync PUT request."""
        if not self._sync_client:
            return self.credential.request(self._build_url(url), "PUT", **kwargs)
        return self._sync_client.put(self._build_url(url), **kwargs)

    def patch_sync(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a sync PATCH request."""
        if not self._sync_client:
            return self.credential.request(self._build_url(url), "PATCH", **kwargs)
        return self._sync_client.patch(self._build_url(url), **kwargs)

    def delete_sync(self, url: str, **kwargs: Any) -> httpx.Response:
        """Make a sync DELETE request."""
        if not self._sync_client:
            return self.credential.request(self._build_url(url), "DELETE", **kwargs)
        return self._sync_client.delete(self._build_url(url), **kwargs)


class _SyncClientContext:
    """Sync context manager for AgentClient."""

    def __init__(self, client: AgentClient) -> None:
        self._client = client

    def __enter__(self) -> AgentClient:
        self._client._sync_client = httpx.Client(timeout=self._client.timeout)
        self._client.credential.wrap_httpx(self._client._sync_client)
        self._client.credential.load()
        return self._client

    def __exit__(self, *args: Any) -> None:
        if self._client._sync_client:
            self._client._sync_client.close()
            self._client._sync_client = None


# Optional requests adapter
try:
    import requests as _requests

    class RequestsAdapter:
        """
        Adapter for using AgentID with the requests library.

        Usage:
            from agentid.client import RequestsAdapter

            adapter = RequestsAdapter("cred_xxx")
            response = adapter.get("https://api.example.com/data")
        """

        def __init__(
            self,
            credential_id: str,
            *,
            api_key: str | None = None,
            **credential_kwargs: Any,
        ) -> None:
            """Initialize the requests adapter."""
            self.credential = AgentCredential(
                credential_id,
                api_key=api_key,
                **credential_kwargs,
            )
            self._session: _requests.Session | None = None

        def _ensure_loaded(self) -> None:
            """Ensure credential is loaded."""
            if not self.credential.is_loaded:
                self.credential.load()
            elif self.credential.auto_refresh and self.credential.needs_refresh:
                self.credential.load()

        def _add_headers(
            self,
            method: str,
            url: str,
            kwargs: dict[str, Any],
        ) -> dict[str, Any]:
            """Add credential headers to request kwargs."""
            self._ensure_loaded()

            body = kwargs.get("data") or kwargs.get("json")
            if isinstance(body, dict):
                import json
                body = json.dumps(body)

            headers = kwargs.pop("headers", {})
            headers.update(self.credential.get_headers(method, url, body))
            kwargs["headers"] = headers

            return kwargs

        def get(self, url: str, **kwargs: Any) -> _requests.Response:
            """Make a GET request."""
            kwargs = self._add_headers("GET", url, kwargs)
            session = self._session or _requests
            return session.get(url, **kwargs)

        def post(self, url: str, **kwargs: Any) -> _requests.Response:
            """Make a POST request."""
            kwargs = self._add_headers("POST", url, kwargs)
            session = self._session or _requests
            return session.post(url, **kwargs)

        def put(self, url: str, **kwargs: Any) -> _requests.Response:
            """Make a PUT request."""
            kwargs = self._add_headers("PUT", url, kwargs)
            session = self._session or _requests
            return session.put(url, **kwargs)

        def patch(self, url: str, **kwargs: Any) -> _requests.Response:
            """Make a PATCH request."""
            kwargs = self._add_headers("PATCH", url, kwargs)
            session = self._session or _requests
            return session.patch(url, **kwargs)

        def delete(self, url: str, **kwargs: Any) -> _requests.Response:
            """Make a DELETE request."""
            kwargs = self._add_headers("DELETE", url, kwargs)
            session = self._session or _requests
            return session.delete(url, **kwargs)

        def session(self) -> _requests.Session:
            """
            Get a requests Session with credential auth.

            The session will automatically include credential headers
            in all requests.

            Returns:
                A configured requests Session
            """
            if self._session is None:
                self._session = _requests.Session()
            return self._session

        def __enter__(self) -> RequestsAdapter:
            self._session = _requests.Session()
            self.credential.load()
            return self

        def __exit__(self, *args: Any) -> None:
            if self._session:
                self._session.close()
                self._session = None

except ImportError:
    # requests not installed
    RequestsAdapter = None  # type: ignore
