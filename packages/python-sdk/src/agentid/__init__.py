"""
AgentID Python SDK

Python SDK for verifying AI agent credentials issued by AgentID.

Example:
    >>> from agentid import AgentIDClient
    >>>
    >>> async with AgentIDClient() as client:
    ...     result = await client.verify(credential_id="uuid")
    ...     if result.valid:
    ...         print(f"Agent: {result.credential.agent_name}")
"""

from agentid.client import AgentIDClient
from agentid.verify import verify_credential_offline
from agentid.crypto import verify_signature, canonical_json, base64_decode, base64_encode
from agentid.types import (
    # Client types
    VerifyResult,
    VerifiedCredential,
    VerifyError,
    # Batch types
    BatchVerifyResult,
    BatchVerifyResultItem,
    BatchVerifySummary,
    # Credential types
    CredentialPayload,
    CredentialConstraints,
    IssuerInfo,
    # Reputation types
    ReputationInfo,
    LeaderboardEntry,
    # Enums
    AgentType,
    IssuerType,
    ErrorCode,
)
from agentid.errors import (
    AgentIDError,
    InvalidRequestError,
    MissingInputError,
    CredentialNotFoundError,
    CredentialRevokedError,
    CredentialExpiredError,
    CredentialNotYetValidError,
    InvalidSignatureError,
    IssuerNotFoundError,
    InternalError,
    NetworkError,
    TimeoutError,
)

__version__ = "1.0.0"

__all__ = [
    # Client
    "AgentIDClient",
    # Verification
    "verify_credential_offline",
    # Crypto utilities
    "verify_signature",
    "canonical_json",
    "base64_decode",
    "base64_encode",
    # Types
    "VerifyResult",
    "VerifiedCredential",
    "VerifyError",
    "BatchVerifyResult",
    "BatchVerifyResultItem",
    "BatchVerifySummary",
    "CredentialPayload",
    "CredentialConstraints",
    "IssuerInfo",
    "ReputationInfo",
    "LeaderboardEntry",
    "AgentType",
    "IssuerType",
    "ErrorCode",
    # Errors
    "AgentIDError",
    "InvalidRequestError",
    "MissingInputError",
    "CredentialNotFoundError",
    "CredentialRevokedError",
    "CredentialExpiredError",
    "CredentialNotYetValidError",
    "InvalidSignatureError",
    "IssuerNotFoundError",
    "InternalError",
    "NetworkError",
    "TimeoutError",
]
