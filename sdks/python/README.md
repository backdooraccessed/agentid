# AgentID Python SDK

Official Python SDK for [AgentID](https://agentid.dev) - Identity and authorization for AI agents.

## Installation

```bash
pip install agentid
```

With optional dependencies:

```bash
# For requests library support
pip install agentid[requests]

# For LangChain integration
pip install agentid[langchain]

# For FastAPI integration
pip install agentid[fastapi]

# All optional dependencies
pip install agentid[all]
```

## Quick Start

### For AI Agents (Presenting Credentials)

```python
from agentid import AgentCredential

# Initialize with your credential ID
cred = AgentCredential("cred_xxx")

# Make authenticated requests (sync)
response = cred.request("https://api.example.com/data")

# Or async
response = await cred.request_async("https://api.example.com/data")
```

### For Services (Verifying Credentials)

```python
from agentid import CredentialVerifier

verifier = CredentialVerifier()

# Verify from request headers
result = verifier.verify_request(
    headers=dict(request.headers),
    method="GET",
    url=str(request.url),
)

if result.valid:
    print(f"Request from: {result.credential.agent_name}")
    print(f"Trust score: {result.trust_score}")
else:
    print(f"Invalid: {result.error}")
```

## Usage

### AgentCredential

The main class for agents to present their credentials:

```python
from agentid import AgentCredential

# Basic initialization
cred = AgentCredential("cred_xxx")

# With API key (for private credentials)
cred = AgentCredential("cred_xxx", api_key="key_xxx")

# Custom options
cred = AgentCredential(
    "cred_xxx",
    api_base="https://custom.agentid.dev/api",
    auto_refresh=True,         # Refresh before expiry
    refresh_threshold=300.0,   # Refresh 5 min before expiry
)
```

#### Making Requests

```python
# Simple request
response = cred.request("https://api.example.com/data")

# With method and body
response = cred.request(
    "https://api.example.com/users",
    method="POST",
    json={"name": "New User"},
)

# Async version
response = await cred.request_async("https://api.example.com/data")
```

#### Getting Headers

If you want to add headers to your own HTTP client:

```python
headers = cred.get_headers(
    method="POST",
    url="https://api.example.com/data",
    body='{"key": "value"}',
)
# Returns:
# {
#     "X-AgentID-Credential": "cred_xxx",
#     "X-AgentID-Timestamp": "1234567890",
#     "X-AgentID-Nonce": "abc123",
#     "X-AgentID-Signature": "base64signature",
# }
```

#### Wrapping HTTP Clients

```python
import httpx

cred = AgentCredential("cred_xxx")

# Wrap httpx client
async with httpx.AsyncClient() as client:
    cred.wrap_httpx(client)
    # All requests now include AgentID headers
    response = await client.get("https://api.example.com/data")

# Sync client
with httpx.Client() as client:
    cred.wrap_httpx(client)
    response = client.get("https://api.example.com/data")
```

### AgentClient

Higher-level client with credential management built in:

```python
from agentid import AgentClient

# Async usage
async with AgentClient("cred_xxx") as client:
    response = await client.get("https://api.example.com/data")
    response = await client.post("https://api.example.com/data", json={...})

# Sync usage
with AgentClient("cred_xxx").sync() as client:
    response = client.get_sync("https://api.example.com/data")

# With base URL
async with AgentClient("cred_xxx", base_url="https://api.example.com") as client:
    response = await client.get("/data")  # Becomes https://api.example.com/data
```

### Using with Requests Library

```python
from agentid import RequestsAdapter

# Basic usage
adapter = RequestsAdapter("cred_xxx")
response = adapter.get("https://api.example.com/data")

# As context manager
with RequestsAdapter("cred_xxx") as adapter:
    response = adapter.get("https://api.example.com/data")
    response = adapter.post("https://api.example.com/data", json={...})
```

### CredentialVerifier

For services that need to verify incoming agent requests:

```python
from agentid import CredentialVerifier, check_permission

verifier = CredentialVerifier()

# Verify by credential ID
result = verifier.verify_credential("cred_xxx")

# Verify from request headers
result = verifier.verify_request(
    headers={"X-AgentID-Credential": "cred_xxx", ...},
    method="POST",
    url="https://your-api.com/endpoint",
    body=request_body,
)

if result.valid:
    # Access credential info
    agent_name = result.credential.agent_name
    issuer = result.credential.issuer.name
    trust_score = result.trust_score

    # Check permissions
    allowed = check_permission(
        result.credential.permissions,
        resource="https://your-api.com/users",
        action="write",
        context={"amount": 100},
    )

    if allowed["granted"]:
        # Process request
        pass
    else:
        # Deny with reason
        print(allowed["reason"])
```

### LangChain Integration

```python
from langchain.agents import create_react_agent
from agentid.integrations.langchain import AgentIDCallback

# Add callback to include credentials in all tool calls
agent = create_react_agent(llm, tools, prompt)
result = agent.invoke(
    {"input": "..."},
    callbacks=[AgentIDCallback("cred_xxx")]
)
```

Create tools for credential operations:

```python
from agentid.integrations.langchain import (
    create_credential_tool,
    create_verification_tool,
)

tools = [
    create_credential_tool("cred_xxx"),  # Present own credential
    create_verification_tool(),           # Verify other credentials
    ...other_tools...
]
```

### FastAPI Integration

Protect your FastAPI endpoints with AgentID credentials using middleware or dependency injection.

#### Using Middleware (All Routes)

```python
from fastapi import FastAPI
from agentid.integrations.fastapi import AgentIDMiddleware, AgentIDConfig

app = FastAPI()

# Protect all routes
app.add_middleware(AgentIDMiddleware)

# Or with configuration
app.add_middleware(
    AgentIDMiddleware,
    config=AgentIDConfig(
        required=True,
        min_trust_score=50,
        exclude_paths=["/health", "/docs", "/openapi.json"],
    )
)

@app.get("/api/data")
async def get_data():
    return {"message": "Protected endpoint"}
```

#### Using Dependencies (Specific Routes)

```python
from fastapi import FastAPI, Depends
from agentid.integrations.fastapi import (
    require_credential,
    require_permission,
    require_trust_score,
    require_verified_issuer,
    get_credential,
)

app = FastAPI()

# Require valid credential
@app.get("/api/data")
async def get_data(credential=Depends(require_credential())):
    return {"agent": credential.agent_name}

# Require specific permission
@app.post("/api/users")
async def create_user(credential=Depends(require_permission("users:write"))):
    return {"created": True}

# Require multiple permissions
@app.delete("/api/users/{id}")
async def delete_user(credential=Depends(require_permission("users:write", "users:delete"))):
    return {"deleted": True}

# Require minimum trust score
@app.post("/api/payments")
async def create_payment(credential=Depends(require_trust_score(80))):
    return {"processed": True}

# Require verified issuer
@app.get("/api/admin")
async def admin(credential=Depends(require_verified_issuer())):
    return {"admin": True}
```

#### Standalone Verifier (No Middleware)

For routes that need verification without global middleware:

```python
from fastapi import FastAPI, Depends
from agentid.integrations.fastapi import AgentIDVerifierDep

app = FastAPI()
verifier = AgentIDVerifierDep()

# Required credential
@app.get("/api/protected")
async def protected(credential=Depends(verifier)):
    return {"agent": credential.agent_name}

# Optional credential
@app.get("/api/public")
async def public(credential=Depends(verifier.optional())):
    if credential:
        return {"agent": credential.agent_name, "authenticated": True}
    return {"message": "Anonymous access", "authenticated": False}
```

#### Custom Policy

```python
from agentid.integrations.fastapi import AgentIDMiddleware, AgentIDConfig

def admin_policy(credential, request):
    # Custom authorization logic
    return credential.issuer.is_verified and "admin" in credential.agent_name

app.add_middleware(
    AgentIDMiddleware,
    config=AgentIDConfig(
        required=True,
        policy=admin_policy,
    )
)
```

## Credential Lifecycle

```python
cred = AgentCredential("cred_xxx")

# Check status
print(cred.is_loaded)       # Has credential been fetched?
print(cred.is_active)       # Is it active and not expired?
print(cred.is_expired)      # Has it expired?
print(cred.time_to_expiry)  # Seconds until expiration
print(cred.needs_refresh)   # Should we refresh soon?

# Force refresh
cred.load(force=True)
```

## Error Handling

```python
from agentid import (
    AgentCredential,
    CredentialNotFoundError,
    CredentialExpiredError,
    CredentialRevokedError,
    RateLimitError,
    NetworkError,
)

cred = AgentCredential("cred_xxx")

try:
    cred.load()
except CredentialNotFoundError:
    print("Credential doesn't exist")
except CredentialExpiredError:
    print("Credential has expired")
except CredentialRevokedError:
    print("Credential was revoked")
except RateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after}s")
except NetworkError:
    print("Network error connecting to AgentID")
```

## Caching

The SDK caches credential data to minimize API calls:

```python
from agentid import AgentCredential, CredentialCache

# Use default global cache
cred = AgentCredential("cred_xxx")

# Use custom cache
cache = CredentialCache(default_ttl=600.0)  # 10 minute TTL
cred = AgentCredential("cred_xxx", cache=cache)

# Cache operations
cache.clear()
cache.cleanup_expired()
print(cache.size())
```

## Environment Variables

```bash
# Optional: Set default API base
export AGENTID_API_BASE=https://agentid.dev/api
```

## Types

All types are available for type hints:

```python
from agentid import (
    CredentialPayload,
    CredentialStatus,
    IssuerInfo,
    Permission,
    PermissionConditions,
    VerificationResult,
)
```

## Development

```bash
# Clone and install
git clone https://github.com/agentid/agentid-python
cd agentid-python
pip install -e ".[dev]"

# Run tests
pytest

# Type checking
mypy agentid

# Linting
ruff check agentid
```

## License

MIT
