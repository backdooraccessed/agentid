"""
AgentID Client

Main client class for online credential verification.
"""

from typing import Any, Optional, Union

import httpx

from agentid.errors import NetworkError, TimeoutError, create_error_from_code
from agentid.types import (
    BatchVerifyResult,
    CredentialPayload,
    LeaderboardEntry,
    ReputationInfo,
    VerifyResult,
)
from agentid.verify import verify_credential_offline


DEFAULT_BASE_URL = "https://agentid-woad.vercel.app"
DEFAULT_TIMEOUT = 5.0


class AgentIDClient:
    """
    AgentID Client for verifying AI agent credentials.

    Example:
        >>> from agentid import AgentIDClient
        >>>
        >>> async with AgentIDClient() as client:
        ...     result = await client.verify(credential_id="uuid")
        ...     if result.valid:
        ...         print(f"Agent: {result.credential.agent_name}")
    """

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
    ):
        """
        Create a new AgentID client.

        Args:
            base_url: Base URL of the AgentID API
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "AgentIDClient":
        """Async context manager entry."""
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def verify(
        self,
        credential_id: Optional[str] = None,
        credential: Optional[Union[CredentialPayload, dict[str, Any]]] = None,
    ) -> VerifyResult:
        """
        Verify a credential online.

        Supports two verification modes:
        1. By credential_id - Looks up the credential in AgentID and verifies it
        2. By credential payload - Verifies the provided credential against AgentID

        Args:
            credential_id: UUID of the credential to verify
            credential: Full credential payload to verify

        Returns:
            VerifyResult with valid=True on success, or error details on failure
        """
        # Build request body
        body: dict[str, Any] = {}
        if credential_id:
            body["credential_id"] = credential_id
        if credential:
            if isinstance(credential, CredentialPayload):
                body["credential"] = credential.model_dump()
            else:
                body["credential"] = credential

        try:
            response = await self._get_client().post(
                f"{self.base_url}/api/verify",
                json=body,
            )
            data = response.json()
            return VerifyResult.model_validate(data)
        except httpx.TimeoutException:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        except httpx.RequestError as e:
            raise NetworkError(f"Network error: {e}")

    async def verify_offline(
        self,
        credential: Union[CredentialPayload, dict[str, Any]],
        issuer_public_key: str,
    ) -> VerifyResult:
        """
        Verify a credential offline using the issuer's public key.

        This method performs verification without making any network calls.
        Note: Offline verification cannot check revocation status.

        Args:
            credential: The full credential payload to verify
            issuer_public_key: Base64-encoded Ed25519 public key

        Returns:
            VerifyResult with valid=True on success, or error details on failure
        """
        return verify_credential_offline(credential, issuer_public_key)

    async def verify_batch(
        self,
        credentials: list[dict[str, Any]],
        fail_fast: bool = False,
        include_details: bool = True,
    ) -> BatchVerifyResult:
        """
        Verify multiple credentials in a single request.

        Args:
            credentials: List of credentials to verify. Each item should have
                         either 'credential_id' or 'credential' key.
            fail_fast: Stop on first failure (default: False)
            include_details: Include full credential details in response (default: True)

        Returns:
            BatchVerifyResult with individual results and summary
        """
        body = {
            "credentials": credentials,
            "options": {
                "fail_fast": fail_fast,
                "include_details": include_details,
            },
        }

        try:
            response = await self._get_client().post(
                f"{self.base_url}/api/verify/batch",
                json=body,
                timeout=self.timeout * 2,  # Double timeout for batch
            )
            data = response.json()
            return BatchVerifyResult.model_validate(data)
        except httpx.TimeoutException:
            raise TimeoutError(f"Batch request timed out after {self.timeout * 2}s")
        except httpx.RequestError as e:
            raise NetworkError(f"Network error: {e}")

    async def get_reputation(self, credential_id: str) -> ReputationInfo:
        """
        Get reputation information for a credential.

        Args:
            credential_id: The credential ID to look up

        Returns:
            ReputationInfo with trust score and verification stats
        """
        try:
            response = await self._get_client().get(
                f"{self.base_url}/api/reputation/agent/{credential_id}",
            )

            if response.status_code == 404:
                raise create_error_from_code(
                    "CREDENTIAL_NOT_FOUND",
                    "Reputation data not found for this credential",
                )

            if not response.is_success:
                raise create_error_from_code(
                    "INTERNAL_ERROR",
                    f"Failed to get reputation: {response.status_code}",
                )

            data = response.json()
            return ReputationInfo.model_validate(data)
        except httpx.TimeoutException:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        except httpx.RequestError as e:
            raise NetworkError(f"Network error: {e}")

    async def get_leaderboard(self, limit: int = 10) -> list[LeaderboardEntry]:
        """
        Get the reputation leaderboard.

        Args:
            limit: Number of results (default: 10, max: 100)

        Returns:
            List of LeaderboardEntry with top agents by trust score
        """
        try:
            response = await self._get_client().get(
                f"{self.base_url}/api/reputation/leaderboard",
                params={"limit": min(100, max(1, limit))},
            )

            if not response.is_success:
                raise create_error_from_code(
                    "INTERNAL_ERROR",
                    f"Failed to get leaderboard: {response.status_code}",
                )

            data = response.json()
            return [
                LeaderboardEntry.model_validate(entry)
                for entry in data.get("leaderboard", [])
            ]
        except httpx.TimeoutException:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        except httpx.RequestError as e:
            raise NetworkError(f"Network error: {e}")

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
