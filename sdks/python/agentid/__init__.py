"""
AgentID Python SDK

Identity and authorization for AI agents.

Basic Usage:
    from agentid import AgentCredential

    # Create credential
    cred = AgentCredential("cred_xxx")

    # Make authenticated request
    response = cred.request("https://api.example.com/data")

    # Or with async
    response = await cred.request_async("https://api.example.com/data")

Using with httpx:
    import httpx
    from agentid import AgentCredential

    cred = AgentCredential("cred_xxx")

    # Wrap an existing client
    async with httpx.AsyncClient() as client:
        cred.wrap_httpx(client)
        response = await client.get("https://api.example.com/data")

Using AgentClient (higher-level):
    from agentid import AgentClient

    async with AgentClient("cred_xxx") as client:
        response = await client.get("https://api.example.com/data")

For Services (verifying credentials):
    from agentid import CredentialVerifier

    verifier = CredentialVerifier()
    result = verifier.verify_request(
        headers=request.headers,
        method="GET",
        url=str(request.url),
    )

    if result.valid:
        print(f"Request from: {result.credential.agent_name}")

LangChain Integration:
    from agentid.integrations.langchain import AgentIDCallback

    agent.invoke(
        {"input": "..."},
        callbacks=[AgentIDCallback("cred_xxx")]
    )
"""

from agentid.cache import CredentialCache, get_global_cache
from agentid.client import AgentClient
from agentid.credential import AgentCredential, agent_request
from agentid.exceptions import (
    AgentIDError,
    AuthenticationError,
    CredentialExpiredError,
    CredentialInvalidError,
    CredentialNotFoundError,
    CredentialRevokedError,
    NetworkError,
    RateLimitError,
    SignatureError,
)
from agentid.signature import RequestSigner
from agentid.types import (
    AgentInfo,
    CredentialConstraints,
    CredentialPayload,
    CredentialStatus,
    IssuerInfo,
    Permission,
    PermissionConditions,
    PermissionPolicyInfo,
    ReputationInfo,
    VerificationResult,
)
from agentid.verifier import CredentialVerifier, check_permission

# Revocation
from agentid.revocation import (
    ConnectionState,
    RevocationEvent,
    RevocationSubscriber,
    create_revocation_aware_verifier,
)

# Registry
from agentid.registry import (
    AgentProfile,
    AgentRegistry,
    AgentRegistrationOptions,
    AgentSearchOptions,
    AgentSearchResult,
    Category,
    create_registry,
)

# A2A Protocol
from agentid.a2a import (
    A2AClient,
    A2AConversation,
    A2AMessage,
    A2AAuthorizationRequest,
    create_a2a_client,
)

# Try to import requests adapter
try:
    from agentid.client import RequestsAdapter
except ImportError:
    RequestsAdapter = None  # type: ignore

__version__ = "0.1.0"

__all__ = [
    # Core classes
    "AgentCredential",
    "AgentClient",
    "CredentialVerifier",
    "RequestSigner",
    # Cache
    "CredentialCache",
    "get_global_cache",
    # Revocation
    "RevocationSubscriber",
    "RevocationEvent",
    "ConnectionState",
    "create_revocation_aware_verifier",
    # Registry
    "AgentRegistry",
    "AgentRegistrationOptions",
    "AgentSearchOptions",
    "AgentProfile",
    "AgentSearchResult",
    "Category",
    "create_registry",
    # A2A Protocol
    "A2AClient",
    "A2AConversation",
    "A2AMessage",
    "A2AAuthorizationRequest",
    "create_a2a_client",
    # Types
    "AgentInfo",
    "CredentialConstraints",
    "CredentialPayload",
    "CredentialStatus",
    "IssuerInfo",
    "Permission",
    "PermissionConditions",
    "PermissionPolicyInfo",
    "ReputationInfo",
    "VerificationResult",
    # Exceptions
    "AgentIDError",
    "AuthenticationError",
    "CredentialExpiredError",
    "CredentialInvalidError",
    "CredentialNotFoundError",
    "CredentialRevokedError",
    "NetworkError",
    "RateLimitError",
    "SignatureError",
    # Functions
    "agent_request",
    "check_permission",
    # Optional
    "RequestsAdapter",
]
