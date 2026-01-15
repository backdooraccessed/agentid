"""AgentID SDK Exceptions."""

from typing import Any


class AgentIDError(Exception):
    """Base exception for AgentID SDK."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class CredentialNotFoundError(AgentIDError):
    """Raised when a credential cannot be found."""

    pass


class CredentialExpiredError(AgentIDError):
    """Raised when a credential has expired."""

    pass


class CredentialRevokedError(AgentIDError):
    """Raised when a credential has been revoked."""

    pass


class CredentialInvalidError(AgentIDError):
    """Raised when a credential is invalid."""

    pass


class AuthenticationError(AgentIDError):
    """Raised when authentication fails."""

    pass


class RateLimitError(AgentIDError):
    """Raised when rate limit is exceeded."""

    def __init__(
        self,
        message: str,
        retry_after: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, details)
        self.retry_after = retry_after


class NetworkError(AgentIDError):
    """Raised when a network error occurs."""

    pass


class SignatureError(AgentIDError):
    """Raised when signature generation or verification fails."""

    pass
