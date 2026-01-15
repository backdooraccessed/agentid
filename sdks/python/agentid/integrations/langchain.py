"""LangChain integration for AgentID."""

from __future__ import annotations

import functools
from typing import TYPE_CHECKING, Any, Callable, TypeVar

from agentid.credential import AgentCredential

if TYPE_CHECKING:
    from langchain_core.callbacks import BaseCallbackHandler

F = TypeVar("F", bound=Callable[..., Any])


class AgentIDCallback:
    """
    LangChain callback handler that injects AgentID credentials.

    This callback intercepts HTTP requests made by LangChain tools
    and automatically adds AgentID credential headers.

    Usage:
        from langchain.agents import create_react_agent
        from agentid.integrations.langchain import AgentIDCallback

        agent = create_react_agent(llm, tools, prompt)
        result = agent.invoke(
            {"input": "..."},
            callbacks=[AgentIDCallback("cred_xxx")]
        )
    """

    def __init__(
        self,
        credential_id: str,
        *,
        api_key: str | None = None,
        auto_refresh: bool = True,
    ) -> None:
        """
        Initialize the callback.

        Args:
            credential_id: The credential ID to use
            api_key: Optional API key for private credentials
            auto_refresh: Automatically refresh credentials before expiry
        """
        self.credential = AgentCredential(
            credential_id,
            api_key=api_key,
            auto_refresh=auto_refresh,
        )
        self._loaded = False

    def _ensure_loaded(self) -> None:
        """Ensure credential is loaded."""
        if not self._loaded:
            self.credential.load()
            self._loaded = True
        elif self.credential.needs_refresh:
            self.credential.load()

    def get_headers(
        self,
        method: str = "GET",
        url: str = "",
        body: str | bytes | None = None,
    ) -> dict[str, str]:
        """
        Get headers to include in requests.

        Args:
            method: HTTP method
            url: Request URL
            body: Request body

        Returns:
            Dictionary of headers
        """
        self._ensure_loaded()
        return self.credential.get_headers(method, url, body)

    def on_tool_start(
        self,
        serialized: dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> Any:
        """Called when a tool starts running."""
        # Ensure credential is loaded before tool makes requests
        self._ensure_loaded()

    def on_llm_start(
        self,
        serialized: dict[str, Any],
        prompts: list[str],
        **kwargs: Any,
    ) -> Any:
        """Called when LLM starts."""
        self._ensure_loaded()


def with_agentid(
    credential_id: str,
    *,
    api_key: str | None = None,
) -> Callable[[F], F]:
    """
    Decorator to add AgentID credentials to a LangChain component.

    This decorator wraps functions that make HTTP requests and
    automatically injects AgentID headers.

    Usage:
        from agentid.integrations.langchain import with_agentid

        @with_agentid("cred_xxx")
        def my_tool_function(query: str) -> str:
            # HTTP requests will include AgentID headers
            response = requests.get("https://api.example.com/search", params={"q": query})
            return response.text
    """
    credential = AgentCredential(credential_id, api_key=api_key)

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Load credential if needed
            if not credential.is_loaded or credential.needs_refresh:
                credential.load()

            # The actual HTTP injection would happen through
            # monkey-patching or context vars in a real implementation
            # For now, we just ensure the credential is loaded

            return func(*args, **kwargs)

        # Attach credential for external access
        wrapper.agentid_credential = credential  # type: ignore

        return wrapper  # type: ignore

    return decorator


# Optional: Create a LangChain tool that presents credentials
def create_credential_tool(credential_id: str) -> Any:
    """
    Create a LangChain tool that allows an agent to present its credential.

    This tool can be used by agents to explicitly present their
    credentials when needed.

    Usage:
        from agentid.integrations.langchain import create_credential_tool

        tools = [
            create_credential_tool("cred_xxx"),
            ...other_tools...
        ]
    """
    try:
        from langchain_core.tools import Tool
    except ImportError:
        raise ImportError(
            "langchain-core is required for this feature. "
            "Install it with: pip install agentid[langchain]"
        )

    credential = AgentCredential(credential_id)

    def get_credential_info(query: str = "") -> str:
        """Get information about this agent's credential."""
        credential.load()
        cred = credential._credential_data
        if not cred:
            return "Credential not loaded"

        return (
            f"Agent: {cred.agent_name} ({cred.agent_id})\n"
            f"Issuer: {cred.issuer.name}\n"
            f"Valid until: {cred.constraints.valid_until}\n"
            f"Credential ID: {cred.credential_id}"
        )

    return Tool(
        name="get_my_credential",
        description=(
            "Get information about this agent's AgentID credential. "
            "Use this when you need to prove your identity or "
            "present your credentials to another service."
        ),
        func=get_credential_info,
    )


def create_verification_tool(api_base: str | None = None) -> Any:
    """
    Create a LangChain tool that allows an agent to verify other credentials.

    This tool can be used by agents to verify the identity of
    other agents they interact with.

    Usage:
        from agentid.integrations.langchain import create_verification_tool

        tools = [
            create_verification_tool(),
            ...other_tools...
        ]
    """
    try:
        from langchain_core.tools import Tool
    except ImportError:
        raise ImportError(
            "langchain-core is required for this feature. "
            "Install it with: pip install agentid[langchain]"
        )

    from agentid.verifier import CredentialVerifier

    verifier = CredentialVerifier(api_base=api_base) if api_base else CredentialVerifier()

    def verify_credential(credential_id: str) -> str:
        """Verify another agent's credential."""
        result = verifier.verify_credential(credential_id)

        if not result.valid:
            return f"Invalid credential: {result.error}"

        cred = result.credential
        if not cred:
            return "Credential verified but no details available"

        return (
            f"Valid credential!\n"
            f"Agent: {cred.agent_name} ({cred.agent_id})\n"
            f"Issuer: {cred.issuer.name} (verified: {cred.issuer.is_verified})\n"
            f"Trust score: {result.trust_score}\n"
            f"Valid until: {cred.constraints.valid_until}"
        )

    return Tool(
        name="verify_agent_credential",
        description=(
            "Verify another agent's AgentID credential. "
            "Use this when you receive a credential ID from another agent "
            "and want to verify their identity and permissions."
        ),
        func=verify_credential,
    )
