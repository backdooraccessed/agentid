"""
AgentID SDK Errors

Exception classes for credential verification errors.
"""

from typing import Optional

from agentid.types import ErrorCode


class AgentIDError(Exception):
    """Base exception for AgentID SDK errors."""

    def __init__(
        self,
        message: str,
        code: ErrorCode,
        request_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.request_id = request_id

    def __str__(self) -> str:
        return f"[{self.code.value}] {self.message}"


class InvalidRequestError(AgentIDError):
    """Request validation failed."""

    def __init__(self, message: str, request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.INVALID_REQUEST, request_id)


class MissingInputError(AgentIDError):
    """Required input was not provided."""

    def __init__(self, message: str, request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.MISSING_INPUT, request_id)


class CredentialNotFoundError(AgentIDError):
    """Credential does not exist."""

    def __init__(self, message: str = "Credential not found", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.CREDENTIAL_NOT_FOUND, request_id)


class CredentialRevokedError(AgentIDError):
    """Credential has been revoked."""

    def __init__(self, message: str = "Credential has been revoked", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.CREDENTIAL_REVOKED, request_id)


class CredentialExpiredError(AgentIDError):
    """Credential has expired."""

    def __init__(self, message: str = "Credential has expired", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.CREDENTIAL_EXPIRED, request_id)


class CredentialNotYetValidError(AgentIDError):
    """Credential is not yet valid."""

    def __init__(self, message: str = "Credential not yet valid", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.CREDENTIAL_NOT_YET_VALID, request_id)


class InvalidSignatureError(AgentIDError):
    """Credential signature is invalid."""

    def __init__(self, message: str = "Invalid signature", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.INVALID_SIGNATURE, request_id)


class IssuerNotFoundError(AgentIDError):
    """Credential issuer not found."""

    def __init__(self, message: str = "Issuer not found", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.ISSUER_NOT_FOUND, request_id)


class InternalError(AgentIDError):
    """Internal server error."""

    def __init__(self, message: str = "Internal error", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.INTERNAL_ERROR, request_id)


class NetworkError(AgentIDError):
    """Network communication error."""

    def __init__(self, message: str = "Network error", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.NETWORK_ERROR, request_id)


class TimeoutError(AgentIDError):
    """Request timed out."""

    def __init__(self, message: str = "Request timed out", request_id: Optional[str] = None):
        super().__init__(message, ErrorCode.TIMEOUT_ERROR, request_id)


def create_error_from_code(
    code: str,
    message: str,
    request_id: Optional[str] = None,
) -> AgentIDError:
    """Create an appropriate error instance from an error code."""
    error_map = {
        "INVALID_REQUEST": InvalidRequestError,
        "MISSING_INPUT": MissingInputError,
        "CREDENTIAL_NOT_FOUND": CredentialNotFoundError,
        "CREDENTIAL_REVOKED": CredentialRevokedError,
        "CREDENTIAL_EXPIRED": CredentialExpiredError,
        "CREDENTIAL_NOT_YET_VALID": CredentialNotYetValidError,
        "INVALID_SIGNATURE": InvalidSignatureError,
        "ISSUER_NOT_FOUND": IssuerNotFoundError,
        "INTERNAL_ERROR": InternalError,
        "NETWORK_ERROR": NetworkError,
        "TIMEOUT_ERROR": TimeoutError,
    }

    error_class = error_map.get(code, AgentIDError)
    if error_class == AgentIDError:
        return AgentIDError(message, ErrorCode.INTERNAL_ERROR, request_id)
    return error_class(message, request_id)
