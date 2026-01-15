"""
FastAPI server example for AgentID Python SDK

This example shows how to use the FastAPI middleware and dependencies
to protect API routes and verify agent credentials.

Run with: uvicorn fastapi_server:app --reload
"""

from fastapi import Depends, FastAPI, Request

from agentid.integrations.fastapi import (
    AgentIDConfig,
    AgentIDMiddleware,
    AgentIDVerifierDep,
    get_credential,
    require_credential,
    require_permission,
    require_trust_score,
    require_verified_issuer,
)
from agentid.types import CredentialPayload
from agentid.verifier import check_permission

# Create FastAPI app
app = FastAPI(
    title="AgentID Protected API",
    description="Example API protected with AgentID credentials",
)


# =============================================================================
# Example 1: Middleware for all /api routes
# =============================================================================

# Create a sub-application for /api routes with middleware
api_app = FastAPI()

# Add AgentID middleware with configuration
api_app.add_middleware(
    AgentIDMiddleware,
    config=AgentIDConfig(
        required=True,
        min_trust_score=50,
        exclude_paths=["/health"],
    ),
)


@api_app.get("/data")
async def get_data(request: Request):
    """Basic protected endpoint - requires valid credential."""
    credential = get_credential(request)
    if credential:
        return {
            "message": f"Hello, {credential.agent_name}!",
            "agent_id": credential.agent_id,
        }
    return {"error": "No credential"}


@api_app.get("/health")
async def health():
    """Health check - excluded from verification."""
    return {"status": "healthy"}


# Mount API app
app.mount("/api", api_app)


# =============================================================================
# Example 2: Dependency injection for specific routes
# =============================================================================


@app.get("/protected/data")
async def protected_data(credential: CredentialPayload = Depends(require_credential())):
    """Requires valid credential via dependency injection."""
    return {
        "agent_name": credential.agent_name,
        "agent_id": credential.agent_id,
        "issuer": credential.issuer.name,
    }


@app.get("/protected/high-trust")
async def high_trust_data(
    credential: CredentialPayload = Depends(require_trust_score(80)),
):
    """Requires minimum trust score of 80."""
    return {
        "agent_name": credential.agent_name,
        "message": "You have high trust!",
    }


@app.post("/protected/users")
async def create_user(
    credential: CredentialPayload = Depends(require_permission("users:write")),
):
    """Requires 'users:write' permission."""
    return {
        "created": True,
        "by_agent": credential.agent_name,
    }


@app.delete("/protected/users/{user_id}")
async def delete_user(
    user_id: str,
    credential: CredentialPayload = Depends(
        require_permission("users:write", "users:delete")
    ),
):
    """Requires both 'users:write' and 'users:delete' permissions."""
    return {
        "deleted": True,
        "user_id": user_id,
        "by_agent": credential.agent_name,
    }


@app.get("/protected/admin")
async def admin_only(
    credential: CredentialPayload = Depends(require_verified_issuer()),
):
    """Requires a verified issuer."""
    return {
        "admin": True,
        "issuer": credential.issuer.name,
        "verified": credential.issuer.is_verified,
    }


# =============================================================================
# Example 3: Standalone verifier (no global middleware)
# =============================================================================

verifier = AgentIDVerifierDep(
    cache_ttl=300.0,
    verify_signature=True,
    signature_max_age=300,
)


@app.get("/standalone/protected")
async def standalone_protected(credential: CredentialPayload = Depends(verifier)):
    """Protected with standalone verifier (required credential)."""
    return {
        "agent_name": credential.agent_name,
        "method": "standalone verifier",
    }


@app.get("/standalone/optional")
async def standalone_optional(
    credential: CredentialPayload | None = Depends(verifier.optional()),
):
    """Optional authentication with standalone verifier."""
    if credential:
        return {
            "authenticated": True,
            "agent_name": credential.agent_name,
        }
    return {
        "authenticated": False,
        "message": "Anonymous access allowed",
    }


# =============================================================================
# Example 4: Custom permission checking in handler
# =============================================================================


@app.post("/transactions")
async def create_transaction(
    request: Request,
    credential: CredentialPayload = Depends(require_credential()),
):
    """Custom permission check with context (e.g., transaction amount)."""
    body = await request.json()
    amount = body.get("amount", 0)

    # Check permission with amount context
    allowed = check_permission(
        credential.permissions,
        resource="/transactions",
        action="write",
        context={"amount": amount},
    )

    if not allowed["granted"]:
        return {
            "error": "Permission denied",
            "reason": allowed.get("reason"),
        }

    return {
        "success": True,
        "amount": amount,
        "agent": credential.agent_name,
    }


# =============================================================================
# Example 5: Middleware with custom policy
# =============================================================================

admin_app = FastAPI()


def admin_policy(credential: CredentialPayload, request: Request) -> bool:
    """Custom policy: only allow verified issuers with 'admin' in agent name."""
    if not credential.issuer.is_verified:
        return False
    if "admin" not in credential.agent_name.lower():
        return False
    return True


admin_app.add_middleware(
    AgentIDMiddleware,
    config=AgentIDConfig(
        required=True,
        min_trust_score=90,
        policy=admin_policy,
    ),
)


@admin_app.get("/dashboard")
async def admin_dashboard(request: Request):
    """Admin dashboard - requires verified issuer + high trust + custom policy."""
    credential = get_credential(request)
    return {
        "dashboard": "admin",
        "agent": credential.agent_name if credential else None,
    }


@admin_app.get("/settings")
async def admin_settings(request: Request):
    """Admin settings."""
    return {"settings": {}}


# Mount admin app
app.mount("/admin", admin_app)


# =============================================================================
# Root endpoint
# =============================================================================


@app.get("/")
async def root():
    """Public root endpoint with API documentation."""
    return {
        "name": "AgentID Protected API",
        "docs": "/docs",
        "endpoints": {
            "/api/data": "Middleware protected (requires credential)",
            "/api/health": "Middleware excluded",
            "/protected/data": "Dependency injection (requires credential)",
            "/protected/high-trust": "Requires trust score >= 80",
            "/protected/users": "Requires users:write permission",
            "/protected/admin": "Requires verified issuer",
            "/standalone/protected": "Standalone verifier (required)",
            "/standalone/optional": "Standalone verifier (optional)",
            "/transactions": "Custom permission check",
            "/admin/*": "Custom policy (verified + admin + trust >= 90)",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
