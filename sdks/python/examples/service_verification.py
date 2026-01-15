"""
Service verification example for AgentID Python SDK.

This example shows how services can verify incoming requests
from AI agents using AgentID credentials.
"""

from agentid import CredentialVerifier, check_permission


def verify_request_example():
    """Example of verifying an incoming request."""
    print("=== Verifying Incoming Request ===\n")

    # Create verifier
    verifier = CredentialVerifier(
        cache_ttl=300.0,  # Cache verifications for 5 minutes
        verify_signature=True,  # Verify request signatures
    )

    # Simulate incoming request headers
    # In a real app, these come from the HTTP request
    incoming_headers = {
        "X-AgentID-Credential": "cred_example_123",
        "X-AgentID-Timestamp": "1704067200",
        "X-AgentID-Nonce": "abc123xyz",
        "X-AgentID-Signature": "base64signature==",
        "Content-Type": "application/json",
    }

    # Verify the request
    result = verifier.verify_request(
        headers=incoming_headers,
        method="POST",
        url="https://your-api.com/endpoint",
        body='{"action": "create_user"}',
    )

    if result.valid:
        print("Request verified successfully!")
        print(f"  Agent: {result.credential.agent_name}")
        print(f"  Agent ID: {result.credential.agent_id}")
        print(f"  Issuer: {result.credential.issuer.name}")
        print(f"  Trust Score: {result.trust_score}")
    else:
        print(f"Verification failed: {result.error}")
        print(f"  Error code: {result.error_code}")


def check_permissions_example():
    """Example of checking permissions."""
    print("\n=== Checking Permissions ===\n")

    # Example permissions from a credential
    permissions = [
        {
            "resource": "https://api.example.com/users/*",
            "actions": ["read", "write"],
            "conditions": {
                "max_transaction_amount": 10000,
                "allowed_regions": ["US", "EU"],
            },
        },
        {
            "resource": "https://api.example.com/admin/*",
            "actions": ["read"],
        },
    ]

    # Check various actions
    test_cases = [
        {
            "resource": "https://api.example.com/users/123",
            "action": "read",
            "context": {},
        },
        {
            "resource": "https://api.example.com/users/123",
            "action": "write",
            "context": {"amount": 5000, "region": "US"},
        },
        {
            "resource": "https://api.example.com/users/123",
            "action": "write",
            "context": {"amount": 50000},  # Exceeds limit
        },
        {
            "resource": "https://api.example.com/admin/settings",
            "action": "write",  # Not allowed
            "context": {},
        },
    ]

    for case in test_cases:
        result = check_permission(
            permissions,
            resource=case["resource"],
            action=case["action"],
            context=case["context"],
        )

        status = "ALLOWED" if result["granted"] else "DENIED"
        reason = result.get("reason", "")

        print(f"{case['action'].upper()} {case['resource']}")
        print(f"  Context: {case['context']}")
        print(f"  Result: {status}")
        if reason:
            print(f"  Reason: {reason}")
        print()


def fastapi_middleware_example():
    """Example of integrating with FastAPI."""
    print("=== FastAPI Integration Example ===\n")

    code = '''
from fastapi import FastAPI, Request, HTTPException, Depends
from agentid import CredentialVerifier, check_permission

app = FastAPI()
verifier = CredentialVerifier()

async def verify_agent(request: Request):
    """Dependency to verify AgentID credentials."""
    result = verifier.verify_request(
        headers=dict(request.headers),
        method=request.method,
        url=str(request.url),
        body=await request.body() if request.method in ["POST", "PUT", "PATCH"] else None,
    )

    if not result.valid:
        raise HTTPException(
            status_code=401,
            detail={"error": result.error, "code": result.error_code}
        )

    # Check minimum trust score
    if result.trust_score and result.trust_score < 50:
        raise HTTPException(
            status_code=403,
            detail={"error": "Insufficient trust score", "score": result.trust_score}
        )

    return result

@app.get("/api/data")
async def get_data(credential = Depends(verify_agent)):
    """Protected endpoint - requires valid AgentID credential."""
    return {
        "message": f"Hello, {credential.credential.agent_name}!",
        "trust_score": credential.trust_score,
    }

@app.post("/api/users")
async def create_user(request: Request, credential = Depends(verify_agent)):
    """Protected endpoint with permission check."""
    # Check if agent has write permission
    allowed = check_permission(
        credential.credential.permissions,
        resource="https://your-api.com/users",
        action="write",
    )

    if not allowed["granted"]:
        raise HTTPException(
            status_code=403,
            detail={"error": "Permission denied", "reason": allowed["reason"]}
        )

    body = await request.json()
    return {"created": True, "user": body}
'''
    print(code)


def express_middleware_example():
    """Show what the equivalent Express middleware would look like."""
    print("\n=== Express.js Equivalent (TypeScript SDK) ===\n")

    code = '''
// TypeScript SDK provides similar functionality
import { agentIDMiddleware } from '@agentid/express';

app.use('/api', agentIDMiddleware({
  required: true,
  minTrustScore: 50,
  requiredPermissions: ['api:access'],
}));

app.get('/api/data', (req, res) => {
  // req.agentCredential contains verified credential
  const { agentName, trustScore } = req.agentCredential;
  res.json({ message: `Hello, ${agentName}!` });
});
'''
    print(code)


if __name__ == "__main__":
    verify_request_example()
    check_permissions_example()
    fastapi_middleware_example()
    express_middleware_example()
