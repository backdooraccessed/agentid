"""
AgentID Registry - Agent discovery and registration.

Example:
    from agentid import AgentRegistry

    # Create registry client
    registry = AgentRegistry()

    # Search for agents
    result = await registry.search(query="data analysis")
    for agent in result["agents"]:
        print(f"{agent.display_name}: {agent.trust_score}")

    # Get agent profile
    agent = await registry.get_agent("cred_xxx")
    if agent:
        print(f"Found: {agent.display_name}")

    # Register an agent (requires API key)
    registry = AgentRegistry(api_key="ak_xxx")
    result = await registry.register(
        credential_id="cred_xxx",
        display_name="My Agent",
        description="A helpful agent",
        categories=["data-analysis"],
    )
"""

from dataclasses import dataclass, field
from typing import Any, Optional
import httpx

DEFAULT_API_BASE = "https://agentid.dev"


@dataclass
class AgentRegistrationOptions:
    """Options for registering an agent."""

    credential_id: str
    display_name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    categories: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    endpoint_url: Optional[str] = None
    documentation_url: Optional[str] = None
    support_email: Optional[str] = None
    visibility: str = "public"  # public, unlisted, private


@dataclass
class AgentSearchOptions:
    """Options for searching agents."""

    query: Optional[str] = None
    categories: Optional[list[str]] = None
    capabilities: Optional[list[str]] = None
    min_trust_score: Optional[int] = None
    issuer_verified: Optional[bool] = None
    limit: Optional[int] = None
    offset: Optional[int] = None


@dataclass
class AgentProfile:
    """Full agent profile from registry."""

    id: str
    credential_id: str
    display_name: str
    categories: list[str]
    capabilities: list[str]
    tags: list[str]
    trust_score: int
    is_verified: bool
    is_featured: bool
    verification_count: int
    monthly_verifications: int
    issuer_name: str
    issuer_verified: bool
    created_at: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    endpoint_url: Optional[str] = None
    documentation_url: Optional[str] = None
    api_spec_url: Optional[str] = None
    support_email: Optional[str] = None
    support_url: Optional[str] = None


@dataclass
class AgentSearchResult:
    """Agent search result."""

    id: str
    credential_id: str
    display_name: str
    categories: list[str]
    capabilities: list[str]
    tags: list[str]
    trust_score: int
    is_verified: bool
    is_featured: bool
    issuer_name: str
    issuer_verified: bool
    monthly_verifications: int
    created_at: str
    short_description: Optional[str] = None
    endpoint_url: Optional[str] = None
    documentation_url: Optional[str] = None


@dataclass
class Category:
    """Registry category."""

    id: str
    name: str
    agent_count: int
    description: Optional[str] = None
    icon: Optional[str] = None


class AgentRegistry:
    """
    AgentID Registry client for agent discovery and registration.

    Example:
        # Search agents
        registry = AgentRegistry()
        result = await registry.search(query="data analysis")

        # Register an agent
        registry = AgentRegistry(api_key="ak_xxx")
        result = await registry.register(
            credential_id="cred_xxx",
            display_name="My Agent",
        )
    """

    def __init__(
        self,
        api_base: str = DEFAULT_API_BASE,
        api_key: Optional[str] = None,
    ):
        """
        Initialize registry client.

        Args:
            api_base: Base URL for AgentID API.
            api_key: API key for authenticated requests.
        """
        self.api_base = api_base
        self.api_key = api_key

    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        headers: dict[str, str] = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def search(
        self,
        query: Optional[str] = None,
        categories: Optional[list[str]] = None,
        capabilities: Optional[list[str]] = None,
        min_trust_score: Optional[int] = None,
        issuer_verified: Optional[bool] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Search for agents in the registry.

        Args:
            query: Text query to search.
            categories: Filter by categories.
            capabilities: Filter by capabilities.
            min_trust_score: Minimum trust score required.
            issuer_verified: Only show agents from verified issuers.
            limit: Number of results to return.
            offset: Offset for pagination.

        Returns:
            Dict with 'agents' list and 'total' count.
        """
        params: dict[str, str] = {}

        if query:
            params["query"] = query
        if categories:
            params["categories"] = ",".join(categories)
        if capabilities:
            params["capabilities"] = ",".join(capabilities)
        if min_trust_score is not None:
            params["min_trust_score"] = str(min_trust_score)
        if issuer_verified is not None:
            params["issuer_verified"] = str(issuer_verified).lower()
        if limit is not None:
            params["limit"] = str(limit)
        if offset is not None:
            params["offset"] = str(offset)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/registry",
                params=params,
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to search agents"))

            data = response.json()
            return {
                "agents": [
                    self._transform_search_result(a) for a in data.get("agents", [])
                ],
                "total": data.get("total", 0),
            }

    async def get_agent(self, credential_id: str) -> Optional[AgentProfile]:
        """
        Get agent profile by credential ID.

        Args:
            credential_id: The credential ID.

        Returns:
            AgentProfile if found, None otherwise.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/registry/{credential_id}",
                headers=self._get_headers(),
            )

            if response.status_code == 404:
                return None

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get agent"))

            data = response.json()
            return self._transform_profile(data.get("agent"))

    async def register(
        self,
        credential_id: str,
        display_name: str,
        description: Optional[str] = None,
        short_description: Optional[str] = None,
        categories: Optional[list[str]] = None,
        capabilities: Optional[list[str]] = None,
        tags: Optional[list[str]] = None,
        endpoint_url: Optional[str] = None,
        documentation_url: Optional[str] = None,
        support_email: Optional[str] = None,
        visibility: str = "public",
    ) -> dict[str, str]:
        """
        Register an agent in the registry.

        Args:
            credential_id: Credential ID of the agent to register.
            display_name: Display name for the agent.
            description: Full description of what the agent does.
            short_description: Short description for previews (max 160 chars).
            categories: Categories the agent belongs to.
            capabilities: Capabilities the agent has.
            tags: Tags for search.
            endpoint_url: API endpoint URL.
            documentation_url: Documentation URL.
            support_email: Support email address.
            visibility: Visibility: public, unlisted, or private.

        Returns:
            Dict with 'registry_id'.

        Raises:
            Exception: If API key is not set.
        """
        if not self.api_key:
            raise Exception("API key required for registration")

        body = {
            "credential_id": credential_id,
            "display_name": display_name,
            "description": description,
            "short_description": short_description,
            "categories": categories or [],
            "capabilities": capabilities or [],
            "tags": tags or [],
            "endpoint_url": endpoint_url,
            "documentation_url": documentation_url,
            "support_email": support_email,
            "visibility": visibility,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/registry",
                json=body,
                headers={
                    **self._get_headers(),
                    "Content-Type": "application/json",
                },
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to register agent"))

            data = response.json()
            return {"registry_id": data.get("registry_id")}

    async def update(
        self,
        registry_id: str,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        short_description: Optional[str] = None,
        categories: Optional[list[str]] = None,
        capabilities: Optional[list[str]] = None,
        tags: Optional[list[str]] = None,
        endpoint_url: Optional[str] = None,
        documentation_url: Optional[str] = None,
        support_email: Optional[str] = None,
        visibility: Optional[str] = None,
    ) -> None:
        """
        Update an agent's registry profile.

        Args:
            registry_id: The registry ID.
            display_name: Display name for the agent.
            description: Full description.
            short_description: Short description.
            categories: Categories.
            capabilities: Capabilities.
            tags: Tags.
            endpoint_url: API endpoint URL.
            documentation_url: Documentation URL.
            support_email: Support email.
            visibility: Visibility setting.

        Raises:
            Exception: If API key is not set.
        """
        if not self.api_key:
            raise Exception("API key required for updates")

        body: dict[str, Any] = {}
        if display_name is not None:
            body["display_name"] = display_name
        if description is not None:
            body["description"] = description
        if short_description is not None:
            body["short_description"] = short_description
        if categories is not None:
            body["categories"] = categories
        if capabilities is not None:
            body["capabilities"] = capabilities
        if tags is not None:
            body["tags"] = tags
        if endpoint_url is not None:
            body["endpoint_url"] = endpoint_url
        if documentation_url is not None:
            body["documentation_url"] = documentation_url
        if support_email is not None:
            body["support_email"] = support_email
        if visibility is not None:
            body["visibility"] = visibility

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.api_base}/api/registry/{registry_id}",
                json=body,
                headers={
                    **self._get_headers(),
                    "Content-Type": "application/json",
                },
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to update agent"))

    async def unregister(self, registry_id: str) -> None:
        """
        Remove an agent from the registry.

        Args:
            registry_id: The registry ID.

        Raises:
            Exception: If API key is not set.
        """
        if not self.api_key:
            raise Exception("API key required for unregistration")

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.api_base}/api/registry/{registry_id}",
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to unregister agent"))

    async def get_categories(self) -> list[Category]:
        """
        Get available categories.

        Returns:
            List of Category objects.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/registry/categories",
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get categories"))

            data = response.json()
            return [
                Category(
                    id=c.get("id", ""),
                    name=c.get("name", ""),
                    description=c.get("description"),
                    icon=c.get("icon"),
                    agent_count=c.get("agent_count", 0),
                )
                for c in data.get("categories", [])
            ]

    async def get_featured(self) -> list[AgentSearchResult]:
        """
        Get featured agents.

        Returns:
            List of featured agents.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/registry/featured",
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get featured agents"))

            data = response.json()
            return [
                self._transform_search_result(a) for a in data.get("agents", [])
            ]

    # Synchronous versions for convenience

    def search_sync(
        self,
        query: Optional[str] = None,
        categories: Optional[list[str]] = None,
        capabilities: Optional[list[str]] = None,
        min_trust_score: Optional[int] = None,
        issuer_verified: Optional[bool] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> dict[str, Any]:
        """Synchronous version of search."""
        params: dict[str, str] = {}

        if query:
            params["query"] = query
        if categories:
            params["categories"] = ",".join(categories)
        if capabilities:
            params["capabilities"] = ",".join(capabilities)
        if min_trust_score is not None:
            params["min_trust_score"] = str(min_trust_score)
        if issuer_verified is not None:
            params["issuer_verified"] = str(issuer_verified).lower()
        if limit is not None:
            params["limit"] = str(limit)
        if offset is not None:
            params["offset"] = str(offset)

        response = httpx.get(
            f"{self.api_base}/api/registry",
            params=params,
            headers=self._get_headers(),
        )

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to search agents"))

        data = response.json()
        return {
            "agents": [
                self._transform_search_result(a) for a in data.get("agents", [])
            ],
            "total": data.get("total", 0),
        }

    def get_agent_sync(self, credential_id: str) -> Optional[AgentProfile]:
        """Synchronous version of get_agent."""
        response = httpx.get(
            f"{self.api_base}/api/registry/{credential_id}",
            headers=self._get_headers(),
        )

        if response.status_code == 404:
            return None

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to get agent"))

        data = response.json()
        return self._transform_profile(data.get("agent"))

    def get_categories_sync(self) -> list[Category]:
        """Synchronous version of get_categories."""
        response = httpx.get(
            f"{self.api_base}/api/registry/categories",
            headers=self._get_headers(),
        )

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to get categories"))

        data = response.json()
        return [
            Category(
                id=c.get("id", ""),
                name=c.get("name", ""),
                description=c.get("description"),
                icon=c.get("icon"),
                agent_count=c.get("agent_count", 0),
            )
            for c in data.get("categories", [])
        ]

    def get_featured_sync(self) -> list[AgentSearchResult]:
        """Synchronous version of get_featured."""
        response = httpx.get(
            f"{self.api_base}/api/registry/featured",
            headers=self._get_headers(),
        )

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to get featured agents"))

        data = response.json()
        return [
            self._transform_search_result(a) for a in data.get("agents", [])
        ]

    def _transform_search_result(self, raw: dict[str, Any]) -> AgentSearchResult:
        """Transform raw API response to AgentSearchResult."""
        return AgentSearchResult(
            id=raw.get("id", ""),
            credential_id=raw.get("credential_id", ""),
            display_name=raw.get("display_name", ""),
            short_description=raw.get("short_description"),
            categories=raw.get("categories", []),
            capabilities=raw.get("capabilities", []),
            tags=raw.get("tags", []),
            endpoint_url=raw.get("endpoint_url"),
            documentation_url=raw.get("documentation_url"),
            trust_score=raw.get("trust_score", 0),
            is_verified=raw.get("is_verified", False),
            is_featured=raw.get("is_featured", False),
            issuer_name=raw.get("issuer_name", ""),
            issuer_verified=raw.get("issuer_verified", False),
            monthly_verifications=raw.get("monthly_verifications", 0),
            created_at=raw.get("created_at", ""),
        )

    def _transform_profile(self, raw: dict[str, Any]) -> AgentProfile:
        """Transform raw API response to AgentProfile."""
        return AgentProfile(
            id=raw.get("id", ""),
            credential_id=raw.get("credential_id", ""),
            display_name=raw.get("display_name", ""),
            short_description=raw.get("short_description"),
            description=raw.get("description"),
            logo_url=raw.get("logo_url"),
            categories=raw.get("categories", []),
            capabilities=raw.get("capabilities", []),
            tags=raw.get("tags", []),
            endpoint_url=raw.get("endpoint_url"),
            documentation_url=raw.get("documentation_url"),
            api_spec_url=raw.get("api_spec_url"),
            support_email=raw.get("support_email"),
            support_url=raw.get("support_url"),
            trust_score=raw.get("trust_score", 0),
            is_verified=raw.get("is_verified", False),
            is_featured=raw.get("is_featured", False),
            verification_count=raw.get("verification_count", 0),
            monthly_verifications=raw.get("monthly_verifications", 0),
            issuer_name=raw.get("issuer_name", ""),
            issuer_verified=raw.get("issuer_verified", False),
            created_at=raw.get("created_at", ""),
        )


def create_registry(
    api_base: str = DEFAULT_API_BASE,
    api_key: Optional[str] = None,
) -> AgentRegistry:
    """
    Create a registry client instance.

    Args:
        api_base: Base URL for AgentID API.
        api_key: API key for authenticated requests.

    Returns:
        AgentRegistry instance.
    """
    return AgentRegistry(api_base=api_base, api_key=api_key)
