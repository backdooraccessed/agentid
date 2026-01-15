"""
FastAPI middleware and dependencies for AgentID.

This module provides FastAPI integration for verifying AgentID credentials
in incoming requests.

Usage:
    from fastapi import FastAPI, Depends
    from agentid.integrations.fastapi import (
        AgentIDMiddleware,
        require_credential,
        require_permission,
        require_trust_score,
        get_credential,
    )

    app = FastAPI()

    # Add middleware to verify all requests
    app.add_middleware(AgentIDMiddleware)

    # Or use dependencies for specific routes
    @app.get("/api/data")
    async def get_data(credential = Depends(require_credential())):
        return {"agent": credential.agent_name}

    @app.post("/api/users")
    async def create_user(credential = Depends(require_permission("users:write"))):
        return {"created": True}
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Sequence

from agentid.exceptions import AgentIDError
from agentid.types import CredentialPayload, VerificationResult
from agentid.verifier import CredentialVerifier, check_permission

# Type checking imports
try:
    from fastapi import Depends, HTTPException, Request, Response
    from fastapi.responses import JSONResponse
    from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
    from starlette.types import ASGIApp

    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    # Define placeholder types for when FastAPI isn't installed
    Request = Any  # type: ignore
    Response = Any  # type: ignore
    BaseHTTPMiddleware = object  # type: ignore
    ASGIApp = Any  # type: ignore
    RequestResponseEndpoint = Any  # type: ignore


def _check_fastapi() -> None:
    """Raise ImportError if FastAPI is not available."""
    if not FASTAPI_AVAILABLE:
        raise ImportError(
            "FastAPI is required for this module. "
            "Install it with: pip install fastapi"
        )


# Request state key for storing credential
CREDENTIAL_STATE_KEY = "agentid_credential"
VERIFICATION_STATE_KEY = "agentid_verification"


@dataclass
class AgentIDConfig:
    """Configuration for AgentID middleware."""

    # Whether to require valid credentials (if False, continues without credential)
    required: bool = True

    # Minimum trust score required (None = no minimum)
    min_trust_score: int | None = None

    # Required permissions (checked against all requests)
    required_permissions: list[str] = field(default_factory=list)

    # Paths to exclude from verification (e.g., ["/health", "/docs"])
    exclude_paths: list[str] = field(default_factory=list)

    # Custom policy function
    policy: Callable[[CredentialPayload, Request], bool] | None = None

    # Verifier options
    api_base: str | None = None
    cache_ttl: float = 300.0
    verify_signature: bool = True
    signature_max_age: int = 300


class AgentIDMiddleware(BaseHTTPMiddleware):  # type: ignore
    """
    FastAPI/Starlette middleware for AgentID verification.

    This middleware verifies AgentID credentials on incoming requests
    and attaches the credential to the request state.

    Usage:
        from fastapi import FastAPI
        from agentid.integrations.fastapi import AgentIDMiddleware, AgentIDConfig

        app = FastAPI()

        # Basic usage
        app.add_middleware(AgentIDMiddleware)

        # With configuration
        app.add_middleware(
            AgentIDMiddleware,
            config=AgentIDConfig(
                required=True,
                min_trust_score=50,
                exclude_paths=["/health", "/docs", "/openapi.json"],
            )
        )
    """

    def __init__(
        self,
        app: ASGIApp,
        config: AgentIDConfig | None = None,
    ) -> None:
        _check_fastapi()
        super().__init__(app)
        self.config = config or AgentIDConfig()

        # Create verifier
        verifier_kwargs: dict[str, Any] = {
            "cache_ttl": self.config.cache_ttl,
            "verify_signature": self.config.verify_signature,
            "signature_max_age": self.config.signature_max_age,
        }
        if self.config.api_base:
            verifier_kwargs["api_base"] = self.config.api_base

        self.verifier = CredentialVerifier(**verifier_kwargs)

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Check if path is excluded
        if self._is_excluded(request.url.path):
            return await call_next(request)

        # Extract headers
        headers = dict(request.headers)

        # Get body for signature verification (if needed)
        body: bytes | None = None
        if request.method in ("POST", "PUT", "PATCH"):
            body = await request.body()

        # Verify request
        try:
            result = await self.verifier.verify_request_async(
                headers=headers,
                method=request.method,
                url=str(request.url),
                body=body,
            )
        except AgentIDError as e:
            if self.config.required:
                return JSONResponse(
                    status_code=500,
                    content={"error": str(e), "code": e.code if hasattr(e, "code") else "INTERNAL_ERROR"},
                )
            result = VerificationResult(valid=False, error=str(e))

        # Store verification result on request state
        request.state._agentid_verification = result

        # Check if credential is valid
        if not result.valid:
            if self.config.required:
                return JSONResponse(
                    status_code=401,
                    content={
                        "error": result.error or "Invalid credential",
                        "code": result.error_code or "INVALID_CREDENTIAL",
                    },
                )
            # Not required, continue without credential
            return await call_next(request)

        # Store credential on request state
        request.state._agentid_credential = result.credential

        # Check minimum trust score
        if self.config.min_trust_score is not None:
            if result.trust_score is None or result.trust_score < self.config.min_trust_score:
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "Insufficient trust score",
                        "code": "INSUFFICIENT_TRUST_SCORE",
                        "required": self.config.min_trust_score,
                        "actual": result.trust_score,
                    },
                )

        # Check required permissions
        if self.config.required_permissions and result.credential:
            for permission in self.config.required_permissions:
                allowed = check_permission(
                    result.credential.permissions,
                    resource=str(request.url.path),
                    action=permission,
                )
                if not allowed["granted"]:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "Permission denied",
                            "code": "PERMISSION_DENIED",
                            "required": permission,
                            "reason": allowed.get("reason"),
                        },
                    )

        # Run custom policy
        if self.config.policy and result.credential:
            try:
                allowed = self.config.policy(result.credential, request)
                if not allowed:
                    return JSONResponse(
                        status_code=403,
                        content={"error": "Policy denied", "code": "POLICY_DENIED"},
                    )
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"error": f"Policy error: {e}", "code": "POLICY_ERROR"},
                )

        return await call_next(request)

    def _is_excluded(self, path: str) -> bool:
        """Check if path should be excluded from verification."""
        for excluded in self.config.exclude_paths:
            if path == excluded or path.startswith(excluded.rstrip("/") + "/"):
                return True
        return False


# Dependency injection helpers


def get_credential(request: Request) -> CredentialPayload | None:
    """
    Get the AgentID credential from the request.

    Returns None if no credential is present.

    Usage:
        @app.get("/api/data")
        async def get_data(request: Request):
            credential = get_credential(request)
            if credential:
                return {"agent": credential.agent_name}
            return {"agent": "anonymous"}
    """
    _check_fastapi()
    return getattr(request.state, "_agentid_credential", None)


def get_verification(request: Request) -> VerificationResult | None:
    """
    Get the AgentID verification result from the request.

    Returns None if no verification was performed.
    """
    _check_fastapi()
    return getattr(request.state, "_agentid_verification", None)


def require_credential(
    min_trust_score: int | None = None,
) -> Callable[[Request], CredentialPayload]:
    """
    Dependency that requires a valid AgentID credential.

    Usage:
        @app.get("/api/data")
        async def get_data(credential = Depends(require_credential())):
            return {"agent": credential.agent_name}

        @app.get("/api/sensitive")
        async def sensitive(credential = Depends(require_credential(min_trust_score=80))):
            return {"data": "sensitive"}
    """
    _check_fastapi()

    async def dependency(request: Request) -> CredentialPayload:
        credential = get_credential(request)

        if credential is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "No credential", "code": "NO_CREDENTIAL"},
            )

        if min_trust_score is not None:
            verification = get_verification(request)
            trust_score = verification.trust_score if verification else None

            if trust_score is None or trust_score < min_trust_score:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Insufficient trust score",
                        "code": "INSUFFICIENT_TRUST_SCORE",
                        "required": min_trust_score,
                        "actual": trust_score,
                    },
                )

        return credential

    return dependency


def require_permission(
    *permissions: str,
) -> Callable[[Request], CredentialPayload]:
    """
    Dependency that requires specific permissions.

    Usage:
        @app.post("/api/users")
        async def create_user(credential = Depends(require_permission("users:write"))):
            return {"created": True}

        @app.delete("/api/users/{id}")
        async def delete_user(credential = Depends(require_permission("users:write", "users:delete"))):
            return {"deleted": True}
    """
    _check_fastapi()

    async def dependency(request: Request) -> CredentialPayload:
        credential = get_credential(request)

        if credential is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "No credential", "code": "NO_CREDENTIAL"},
            )

        for permission in permissions:
            allowed = check_permission(
                credential.permissions,
                resource=str(request.url.path),
                action=permission,
            )

            if not allowed["granted"]:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Permission denied",
                        "code": "PERMISSION_DENIED",
                        "required": permission,
                        "reason": allowed.get("reason"),
                    },
                )

        return credential

    return dependency


def require_trust_score(
    min_score: int,
) -> Callable[[Request], CredentialPayload]:
    """
    Dependency that requires a minimum trust score.

    Usage:
        @app.post("/api/payments")
        async def create_payment(credential = Depends(require_trust_score(80))):
            return {"processed": True}
    """
    return require_credential(min_trust_score=min_score)


def require_verified_issuer() -> Callable[[Request], CredentialPayload]:
    """
    Dependency that requires the credential issuer to be verified.

    Usage:
        @app.get("/api/admin")
        async def admin(credential = Depends(require_verified_issuer())):
            return {"admin": True}
    """
    _check_fastapi()

    async def dependency(request: Request) -> CredentialPayload:
        credential = get_credential(request)

        if credential is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "No credential", "code": "NO_CREDENTIAL"},
            )

        if not credential.issuer.is_verified:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Issuer not verified",
                    "code": "ISSUER_NOT_VERIFIED",
                    "issuer": credential.issuer.name,
                },
            )

        return credential

    return dependency


# Standalone verifier dependency (for use without middleware)


class AgentIDVerifierDep:
    """
    Standalone dependency for verifying AgentID credentials without middleware.

    This is useful when you only want to verify credentials on specific routes
    rather than all routes.

    Usage:
        from agentid.integrations.fastapi import AgentIDVerifierDep

        verifier_dep = AgentIDVerifierDep()

        @app.get("/api/protected")
        async def protected(credential = Depends(verifier_dep)):
            return {"agent": credential.agent_name}

        @app.get("/api/optional")
        async def optional(credential = Depends(verifier_dep.optional())):
            if credential:
                return {"agent": credential.agent_name}
            return {"agent": "anonymous"}
    """

    def __init__(
        self,
        api_base: str | None = None,
        cache_ttl: float = 300.0,
        verify_signature: bool = True,
        signature_max_age: int = 300,
    ) -> None:
        _check_fastapi()

        verifier_kwargs: dict[str, Any] = {
            "cache_ttl": cache_ttl,
            "verify_signature": verify_signature,
            "signature_max_age": signature_max_age,
        }
        if api_base:
            verifier_kwargs["api_base"] = api_base

        self.verifier = CredentialVerifier(**verifier_kwargs)

    async def __call__(self, request: Request) -> CredentialPayload:
        """Verify credential (required)."""
        result = await self._verify(request)

        if not result.valid:
            raise HTTPException(
                status_code=401,
                detail={
                    "error": result.error or "Invalid credential",
                    "code": result.error_code or "INVALID_CREDENTIAL",
                },
            )

        if result.credential is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "No credential data", "code": "NO_CREDENTIAL_DATA"},
            )

        # Store on request state for other dependencies
        request.state._agentid_credential = result.credential
        request.state._agentid_verification = result

        return result.credential

    def optional(self) -> Callable[[Request], CredentialPayload | None]:
        """Return a dependency that returns None if no credential."""

        async def dependency(request: Request) -> CredentialPayload | None:
            result = await self._verify(request)

            if result.valid and result.credential:
                request.state._agentid_credential = result.credential
                request.state._agentid_verification = result
                return result.credential

            return None

        return dependency

    async def _verify(self, request: Request) -> VerificationResult:
        """Perform verification."""
        headers = dict(request.headers)

        body: bytes | None = None
        if request.method in ("POST", "PUT", "PATCH"):
            body = await request.body()

        return await self.verifier.verify_request_async(
            headers=headers,
            method=request.method,
            url=str(request.url),
            body=body,
        )
