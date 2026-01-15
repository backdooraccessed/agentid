"""Framework integrations for AgentID SDK."""

from agentid.integrations.langchain import AgentIDCallback, with_agentid

# FastAPI integration (optional import)
try:
    from agentid.integrations.fastapi import (
        AgentIDConfig,
        AgentIDMiddleware,
        AgentIDVerifierDep,
        get_credential,
        get_verification,
        require_credential,
        require_permission,
        require_trust_score,
        require_verified_issuer,
    )

    __all__ = [
        # LangChain
        "AgentIDCallback",
        "with_agentid",
        # FastAPI
        "AgentIDConfig",
        "AgentIDMiddleware",
        "AgentIDVerifierDep",
        "get_credential",
        "get_verification",
        "require_credential",
        "require_permission",
        "require_trust_score",
        "require_verified_issuer",
    ]
except ImportError:
    # FastAPI not installed
    __all__ = ["AgentIDCallback", "with_agentid"]
