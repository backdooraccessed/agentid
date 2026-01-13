# AgentID Python SDK

Python SDK for verifying AI agent credentials issued by AgentID.

## Installation

```bash
pip install agentid
```

## Quick Start

```python
from agentid import AgentIDClient

# Create client
client = AgentIDClient()

# Verify a credential by ID
result = await client.verify(credential_id="your-credential-uuid")

if result.valid:
    print(f"Agent: {result.credential.agent_name}")
    print(f"Permissions: {result.credential.permissions}")
else:
    print(f"Invalid: {result.error.code} - {result.error.message}")
```

## Features

- **Online Verification**: Verify credentials against the AgentID API
- **Batch Verification**: Verify multiple credentials in one request
- **Offline Verification**: Verify credentials locally using Ed25519 signatures
- **Reputation Queries**: Get trust scores for agents and issuers
- **Type Safety**: Full type hints with Pydantic models

## Usage

### Client Configuration

```python
from agentid import AgentIDClient

# Default configuration
client = AgentIDClient()

# Custom configuration
client = AgentIDClient(
    base_url="https://agentid-dashboard.vercel.app",
    timeout=10.0,
)
```

### Online Verification

```python
# Verify by credential ID
result = await client.verify(credential_id="uuid")

# Verify a full credential payload
result = await client.verify(credential=credential_payload)
```

### Batch Verification

```python
result = await client.verify_batch(
    credentials=[
        {"credential_id": "uuid1"},
        {"credential_id": "uuid2"},
        {"credential": full_payload},
    ],
    fail_fast=False,
    include_details=True,
)

print(f"Valid: {result.summary.valid}/{result.summary.total}")

for item in result.results:
    if item.valid:
        print(f"  [{item.index}] Valid: {item.credential.agent_name}")
    else:
        print(f"  [{item.index}] Invalid: {item.error.code}")
```

### Offline Verification

```python
from agentid import verify_credential_offline

result = verify_credential_offline(
    credential=credential_payload,
    issuer_public_key="base64-encoded-public-key",
)
```

### Reputation

```python
# Get agent reputation
reputation = await client.get_reputation(credential_id="uuid")
print(f"Trust score: {reputation.trust_score}")

# Get leaderboard
leaderboard = await client.get_leaderboard(limit=10)
for entry in leaderboard:
    print(f"{entry.rank}. {entry.agent_name} ({entry.trust_score})")
```

### Context Manager

```python
async with AgentIDClient() as client:
    result = await client.verify(credential_id="uuid")
```

## Error Handling

```python
from agentid import AgentIDError, CredentialNotFoundError

try:
    result = await client.verify(credential_id="invalid-uuid")
except CredentialNotFoundError:
    print("Credential does not exist")
except AgentIDError as e:
    print(f"Verification error: {e.code} - {e.message}")
```

## License

MIT
