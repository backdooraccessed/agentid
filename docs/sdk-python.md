# AgentID Python SDK

The AgentID Python SDK provides easy integration with the AgentID credential and verification system.

## Installation

```bash
pip install agentid
```

## Quick Start

```python
from agentid import AgentID

# Initialize with your API key
client = AgentID(api_key="your-api-key")

# Verify a credential
result = client.verify(credential_id="cred-uuid-here")
if result.valid:
    print(f"Agent {result.credential.agent_name} is verified")
```

## Configuration

```python
from agentid import AgentID

# Full configuration
client = AgentID(
    api_key="your-api-key",
    base_url="https://agentid.dev/api",  # Optional, defaults to production
    timeout=30,  # Request timeout in seconds
)
```

## Verification

### Basic Verification

```python
# Verify by credential ID
result = client.verify(credential_id="uuid-here")

# Access result
print(result.valid)              # True/False
print(result.credential.agent_id)
print(result.credential.agent_name)
print(result.issuer.name)
print(result.trust_score)
```

### Verification with Permission Check

```python
# Verify and check specific permission
result = client.verify(
    credential_id="uuid-here",
    check_permission={
        "action": "read:users",
        "resource": "users/123",
        "context": {"amount": 100}
    }
)

if result.permission_check:
    print(result.permission_check.granted)  # True/False
    print(result.permission_check.reason)
```

### Batch Verification

```python
# Verify multiple credentials at once
results = client.verify_batch([
    {"credential_id": "uuid-1"},
    {"credential_id": "uuid-2"},
    {"credential_id": "uuid-3"},
])

for result in results:
    print(f"{result.credential_id}: {result.valid}")
```

## Credential Management

### Issue Credential

```python
credential = client.credentials.create(
    agent_id="agent-unique-id",
    agent_name="My AI Agent",
    agent_type="llm",
    agent_description="A helpful AI assistant",
    permissions={
        "actions": ["read", "write"],
        "domains": ["api.example.com"]
    },
    valid_days=365
)

print(credential.id)
print(credential.signature)
```

### Get Credential

```python
credential = client.credentials.get("credential-uuid")
print(credential.agent_name)
print(credential.status)
```

### List Credentials

```python
credentials = client.credentials.list(
    status="active",
    limit=10
)

for cred in credentials:
    print(f"{cred.agent_name}: {cred.status}")
```

### Revoke Credential

```python
client.credentials.revoke(
    credential_id="uuid-here",
    reason="No longer needed"
)
```

## FastAPI Integration

```python
from fastapi import FastAPI, Depends, HTTPException
from agentid.integrations.fastapi import AgentIDAuth, require_permission

app = FastAPI()

# Initialize auth
auth = AgentIDAuth(api_key="your-api-key")

# Protect endpoint - verify credential
@app.get("/protected")
async def protected_route(credential=Depends(auth.verify)):
    return {"agent": credential.agent_name}

# Require specific permission
@app.post("/data")
async def create_data(
    credential=Depends(require_permission(auth, "write:data"))
):
    return {"status": "created"}
```

## LangChain Integration

```python
from langchain_core.tools import tool
from agentid.integrations.langchain import AgentIDCredentialTool

# Initialize tool
credential_tool = AgentIDCredentialTool(api_key="your-api-key")

# Use in LangChain agent
tools = [credential_tool]

# Or verify within a tool
@tool
def secure_operation(input: str):
    """A secure operation that requires verified credentials."""
    from agentid import AgentID

    client = AgentID(api_key="your-api-key")
    result = client.verify(credential_id="current-agent-credential")

    if not result.valid:
        return "Unauthorized"

    # Proceed with operation
    return f"Processed: {input}"
```

## Error Handling

```python
from agentid import AgentID
from agentid.exceptions import (
    AgentIDError,
    AuthenticationError,
    CredentialNotFoundError,
    ValidationError,
    RateLimitError
)

client = AgentID(api_key="your-api-key")

try:
    result = client.verify(credential_id="uuid")
except AuthenticationError:
    print("Invalid API key")
except CredentialNotFoundError:
    print("Credential does not exist")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AgentIDError as e:
    print(f"AgentID error: {e.message}")
```

## Async Support

```python
import asyncio
from agentid import AsyncAgentID

async def main():
    client = AsyncAgentID(api_key="your-api-key")

    # Async verification
    result = await client.verify(credential_id="uuid")
    print(result.valid)

    # Async batch verification
    results = await client.verify_batch([
        {"credential_id": "uuid-1"},
        {"credential_id": "uuid-2"},
    ])

asyncio.run(main())
```

## Environment Variables

The SDK supports configuration via environment variables:

```bash
export AGENTID_API_KEY="your-api-key"
export AGENTID_BASE_URL="https://agentid.dev/api"
```

```python
from agentid import AgentID

# Will use environment variables automatically
client = AgentID()
```

## Type Hints

The SDK is fully typed for IDE support:

```python
from agentid import AgentID
from agentid.types import VerificationResult, Credential

client = AgentID(api_key="key")
result: VerificationResult = client.verify(credential_id="uuid")
credential: Credential = result.credential
```

## Examples

See the [examples directory](../sdks/python/examples/) for complete working examples:

- `basic_verification.py` - Simple verification flow
- `fastapi_protected.py` - Protected FastAPI endpoints
- `langchain_agent.py` - LangChain agent with verification
- `batch_processing.py` - Processing multiple credentials
