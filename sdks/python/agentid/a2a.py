"""
AgentID A2A (Agent-to-Agent) Protocol

Enables secure communication between AI agents using their AgentID credentials.

Example:
    from agentid import A2AClient

    # Create A2A client
    a2a = A2AClient(
        credential_id="cred_xxx",
        api_key="ak_xxx",
    )

    # Start a conversation
    conversation_id = await a2a.start_conversation(recipient_id="cred_yyy")

    # Send a message
    await a2a.send_message(
        conversation_id=conversation_id,
        content={"text": "Hello!"},
    )

    # Request authorization
    await a2a.request_authorization(
        grantor_id="cred_yyy",
        permissions=[{"action": "read", "resource": "user-data"}],
    )
"""

import hashlib
import secrets
import time
from dataclasses import dataclass, field
from typing import Any, Literal, Optional
import httpx

DEFAULT_API_BASE = "https://agentid.dev"

# Type aliases
A2AMessageType = Literal["text", "request", "response", "authorization", "data", "error"]
ConversationStatus = Literal["active", "closed", "blocked"]
AuthorizationStatus = Literal["pending", "approved", "denied", "revoked", "expired"]


@dataclass
class A2AConversation:
    """A2A conversation between two agents."""

    id: str
    initiator_credential_id: str
    recipient_credential_id: str
    status: ConversationStatus
    encrypted: bool
    created_at: str
    updated_at: str
    subject: Optional[str] = None
    last_message_at: Optional[str] = None
    message_count: Optional[int] = None
    initiator_name: Optional[str] = None
    initiator_issuer: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_issuer: Optional[str] = None


@dataclass
class A2AMessage:
    """A2A message within a conversation."""

    id: str
    conversation_id: str
    sender_credential_id: str
    message_type: A2AMessageType
    content: dict[str, Any]
    signature: str
    signature_timestamp: int
    nonce: str
    delivered: bool
    created_at: str
    reply_to_id: Optional[str] = None
    delivered_at: Optional[str] = None
    read_at: Optional[str] = None


@dataclass
class A2AAuthorizationRequest:
    """A2A authorization request between agents."""

    id: str
    requester_credential_id: str
    grantor_credential_id: str
    requested_permissions: list[dict[str, Any]]
    status: AuthorizationStatus
    valid_from: str
    created_at: str
    scope: Optional[str] = None
    constraints: Optional[dict[str, Any]] = None
    valid_until: Optional[str] = None
    response_message: Optional[str] = None
    responded_at: Optional[str] = None


@dataclass
class A2AMessageContent:
    """Content of an A2A message."""

    text: Optional[str] = None
    data: Optional[Any] = None
    request: Optional[dict[str, Any]] = None
    response: Optional[dict[str, Any]] = None
    authorization: Optional[dict[str, Any]] = None


def generate_nonce() -> str:
    """Generate a random nonce."""
    return secrets.token_hex(16)


def generate_signature(data: str, credential_id: str, secret: Optional[str] = None) -> str:
    """Generate a signature for data."""
    key = secret or credential_id
    message = f"{data}|{credential_id}"
    return hashlib.sha256(message.encode()).hexdigest()


class A2AClient:
    """
    A2A Client for agent-to-agent communication.

    Example:
        a2a = A2AClient(credential_id="cred_xxx", api_key="ak_xxx")

        # Start conversation
        conv_id = await a2a.start_conversation(recipient_id="cred_yyy")

        # Send message
        await a2a.send_message(conv_id, content={"text": "Hello!"})
    """

    def __init__(
        self,
        credential_id: str,
        api_key: str,
        signing_secret: Optional[str] = None,
        api_base: str = DEFAULT_API_BASE,
    ):
        """
        Initialize A2A client.

        Args:
            credential_id: Your agent's credential ID.
            api_key: API key for authentication.
            signing_secret: Secret for signing messages.
            api_base: Base URL for AgentID API.
        """
        self.credential_id = credential_id
        self.api_key = api_key
        self.signing_secret = signing_secret
        self.api_base = api_base.rstrip("/")

    def _sign(self, data: str) -> str:
        """Sign data."""
        return generate_signature(data, self.credential_id, self.signing_secret)

    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # Conversation methods

    async def start_conversation(
        self,
        recipient_id: str,
        subject: Optional[str] = None,
    ) -> str:
        """
        Start a new conversation with another agent.

        Args:
            recipient_id: Credential ID of the recipient agent.
            subject: Optional subject for the conversation.

        Returns:
            Conversation ID.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/a2a/conversations",
                json={
                    "initiator_credential_id": self.credential_id,
                    "recipient_credential_id": recipient_id,
                    "subject": subject,
                },
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to start conversation"))

            data = response.json()
            return data["conversation_id"]

    async def get_conversation(self, conversation_id: str) -> Optional[A2AConversation]:
        """
        Get a conversation by ID.

        Args:
            conversation_id: The conversation ID.

        Returns:
            A2AConversation if found, None otherwise.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/a2a/conversations/{conversation_id}",
                headers=self._get_headers(),
            )

            if response.status_code == 404:
                return None

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get conversation"))

            data = response.json()
            return self._transform_conversation(data["conversation"])

    async def list_conversations(
        self,
        status: Optional[ConversationStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """
        List conversations.

        Args:
            status: Filter by status.
            limit: Number of results.
            offset: Offset for pagination.

        Returns:
            Dict with 'conversations' list and 'total' count.
        """
        params: dict[str, str] = {
            "credential_id": self.credential_id,
            "limit": str(limit),
            "offset": str(offset),
        }
        if status:
            params["status"] = status

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/a2a/conversations",
                params=params,
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to list conversations"))

            data = response.json()
            return {
                "conversations": [
                    self._transform_conversation(c)
                    for c in data.get("conversations", [])
                ],
                "total": data.get("total", 0),
            }

    async def close_conversation(self, conversation_id: str) -> None:
        """
        Close a conversation.

        Args:
            conversation_id: The conversation ID.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.api_base}/api/a2a/conversations/{conversation_id}",
                json={"status": "closed"},
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to close conversation"))

    # Message methods

    async def send_message(
        self,
        conversation_id: str,
        content: dict[str, Any],
        message_type: A2AMessageType = "text",
        reply_to_id: Optional[str] = None,
    ) -> str:
        """
        Send a message in a conversation.

        Args:
            conversation_id: The conversation ID.
            content: Message content.
            message_type: Type of message.
            reply_to_id: ID of message to reply to.

        Returns:
            Message ID.
        """
        nonce = generate_nonce()
        timestamp = int(time.time())

        # Sign the message
        signature_data = f"{conversation_id}|{content}|{timestamp}|{nonce}"
        signature = self._sign(signature_data)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/a2a/conversations/{conversation_id}/messages",
                json={
                    "sender_credential_id": self.credential_id,
                    "message_type": message_type,
                    "content": content,
                    "signature": signature,
                    "signature_timestamp": timestamp,
                    "nonce": nonce,
                    "reply_to_id": reply_to_id,
                },
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to send message"))

            data = response.json()
            return data["message_id"]

    async def get_messages(
        self,
        conversation_id: str,
        limit: int = 50,
        offset: int = 0,
        after: Optional[str] = None,
    ) -> list[A2AMessage]:
        """
        Get messages in a conversation.

        Args:
            conversation_id: The conversation ID.
            limit: Number of messages.
            offset: Offset for pagination.
            after: Get messages after this message ID.

        Returns:
            List of A2AMessage objects.
        """
        params: dict[str, str] = {
            "limit": str(limit),
            "offset": str(offset),
        }
        if after:
            params["after"] = after

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/a2a/conversations/{conversation_id}/messages",
                params=params,
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get messages"))

            data = response.json()
            return [self._transform_message(m) for m in data.get("messages", [])]

    # Authorization methods

    async def request_authorization(
        self,
        grantor_id: str,
        permissions: list[dict[str, Any]],
        scope: Optional[str] = None,
        constraints: Optional[dict[str, Any]] = None,
        valid_until: Optional[str] = None,
    ) -> str:
        """
        Request authorization from another agent.

        Args:
            grantor_id: Credential ID of the agent to request from.
            permissions: Permissions being requested.
            scope: Scope description.
            constraints: Authorization constraints.
            valid_until: When the authorization should expire (ISO datetime).

        Returns:
            Authorization request ID.
        """
        timestamp = int(time.time())
        signature_data = f"{grantor_id}|{permissions}|{scope}|{timestamp}"
        signature = self._sign(signature_data)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/a2a/authorizations",
                json={
                    "requester_credential_id": self.credential_id,
                    "grantor_credential_id": grantor_id,
                    "requested_permissions": permissions,
                    "scope": scope,
                    "constraints": constraints,
                    "valid_until": valid_until,
                    "signature": signature,
                },
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to request authorization"))

            data = response.json()
            return data["authorization_id"]

    async def respond_to_authorization(
        self,
        request_id: str,
        approved: bool,
        message: Optional[str] = None,
    ) -> None:
        """
        Respond to an authorization request (as grantor).

        Args:
            request_id: Authorization request ID.
            approved: Whether to approve the request.
            message: Optional response message.
        """
        timestamp = int(time.time())
        signature_data = f"{request_id}|{approved}|{timestamp}"
        signature = self._sign(signature_data)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/a2a/authorizations/{request_id}",
                json={
                    "grantor_credential_id": self.credential_id,
                    "approved": approved,
                    "message": message,
                    "signature": signature,
                },
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to respond to authorization"))

    async def get_authorization(
        self, request_id: str
    ) -> Optional[A2AAuthorizationRequest]:
        """
        Get an authorization request by ID.

        Args:
            request_id: The authorization request ID.

        Returns:
            A2AAuthorizationRequest if found, None otherwise.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/a2a/authorizations/{request_id}",
                headers=self._get_headers(),
            )

            if response.status_code == 404:
                return None

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to get authorization"))

            data = response.json()
            return self._transform_authorization(data["authorization"])

    async def list_authorizations(
        self,
        role: Optional[Literal["requester", "grantor"]] = None,
        status: Optional[AuthorizationStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """
        List authorization requests.

        Args:
            role: Filter by role (requester or grantor).
            status: Filter by status.
            limit: Number of results.
            offset: Offset for pagination.

        Returns:
            Dict with 'authorizations' list and 'total' count.
        """
        params: dict[str, str] = {
            "credential_id": self.credential_id,
            "limit": str(limit),
            "offset": str(offset),
        }
        if role:
            params["role"] = role
        if status:
            params["status"] = status

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/api/a2a/authorizations",
                params=params,
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to list authorizations"))

            data = response.json()
            return {
                "authorizations": [
                    self._transform_authorization(a)
                    for a in data.get("authorizations", [])
                ],
                "total": data.get("total", 0),
            }

    async def revoke_authorization(self, request_id: str) -> None:
        """
        Revoke a previously granted authorization.

        Args:
            request_id: The authorization request ID.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.api_base}/api/a2a/authorizations/{request_id}",
                json={"action": "revoke"},
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to revoke authorization"))

    async def check_authorization(
        self,
        requester_id: str,
        permission: str,
    ) -> dict[str, Any]:
        """
        Check if an agent is authorized for a specific action.

        Args:
            requester_id: Credential ID of the requesting agent.
            permission: Permission to check.

        Returns:
            Dict with 'authorized', 'authorization_id', 'constraints', 'valid_until'.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/api/a2a/authorizations/check",
                json={
                    "requester_credential_id": requester_id,
                    "grantor_credential_id": self.credential_id,
                    "permission": permission,
                },
                headers=self._get_headers(),
            )

            if not response.is_success:
                data = response.json() if response.content else {}
                raise Exception(data.get("error", "Failed to check authorization"))

            return response.json()

    # Synchronous versions

    def start_conversation_sync(
        self,
        recipient_id: str,
        subject: Optional[str] = None,
    ) -> str:
        """Synchronous version of start_conversation."""
        response = httpx.post(
            f"{self.api_base}/api/a2a/conversations",
            json={
                "initiator_credential_id": self.credential_id,
                "recipient_credential_id": recipient_id,
                "subject": subject,
            },
            headers=self._get_headers(),
        )

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to start conversation"))

        return response.json()["conversation_id"]

    def send_message_sync(
        self,
        conversation_id: str,
        content: dict[str, Any],
        message_type: A2AMessageType = "text",
        reply_to_id: Optional[str] = None,
    ) -> str:
        """Synchronous version of send_message."""
        nonce = generate_nonce()
        timestamp = int(time.time())
        signature_data = f"{conversation_id}|{content}|{timestamp}|{nonce}"
        signature = self._sign(signature_data)

        response = httpx.post(
            f"{self.api_base}/api/a2a/conversations/{conversation_id}/messages",
            json={
                "sender_credential_id": self.credential_id,
                "message_type": message_type,
                "content": content,
                "signature": signature,
                "signature_timestamp": timestamp,
                "nonce": nonce,
                "reply_to_id": reply_to_id,
            },
            headers=self._get_headers(),
        )

        if not response.is_success:
            data = response.json() if response.content else {}
            raise Exception(data.get("error", "Failed to send message"))

        return response.json()["message_id"]

    # Transform methods

    def _transform_conversation(self, raw: dict[str, Any]) -> A2AConversation:
        """Transform raw API response to A2AConversation."""
        return A2AConversation(
            id=raw.get("id", ""),
            initiator_credential_id=raw.get("initiator_credential_id", ""),
            recipient_credential_id=raw.get("recipient_credential_id", ""),
            subject=raw.get("subject"),
            status=raw.get("status", "active"),
            encrypted=raw.get("encrypted", False),
            created_at=raw.get("created_at", ""),
            updated_at=raw.get("updated_at", ""),
            last_message_at=raw.get("last_message_at"),
            message_count=raw.get("message_count"),
            initiator_name=raw.get("initiator_name"),
            initiator_issuer=raw.get("initiator_issuer"),
            recipient_name=raw.get("recipient_name"),
            recipient_issuer=raw.get("recipient_issuer"),
        )

    def _transform_message(self, raw: dict[str, Any]) -> A2AMessage:
        """Transform raw API response to A2AMessage."""
        return A2AMessage(
            id=raw.get("id", ""),
            conversation_id=raw.get("conversation_id", ""),
            sender_credential_id=raw.get("sender_credential_id", ""),
            message_type=raw.get("message_type", "text"),
            content=raw.get("content", {}),
            signature=raw.get("signature", ""),
            signature_timestamp=raw.get("signature_timestamp", 0),
            nonce=raw.get("nonce", ""),
            reply_to_id=raw.get("reply_to_id"),
            delivered=raw.get("delivered", False),
            delivered_at=raw.get("delivered_at"),
            read_at=raw.get("read_at"),
            created_at=raw.get("created_at", ""),
        )

    def _transform_authorization(self, raw: dict[str, Any]) -> A2AAuthorizationRequest:
        """Transform raw API response to A2AAuthorizationRequest."""
        return A2AAuthorizationRequest(
            id=raw.get("id", ""),
            requester_credential_id=raw.get("requester_credential_id", ""),
            grantor_credential_id=raw.get("grantor_credential_id", ""),
            requested_permissions=raw.get("requested_permissions", []),
            scope=raw.get("scope"),
            constraints=raw.get("constraints"),
            valid_from=raw.get("valid_from", ""),
            valid_until=raw.get("valid_until"),
            status=raw.get("status", "pending"),
            response_message=raw.get("response_message"),
            responded_at=raw.get("responded_at"),
            created_at=raw.get("created_at", ""),
        )


def create_a2a_client(
    credential_id: str,
    api_key: str,
    signing_secret: Optional[str] = None,
    api_base: str = DEFAULT_API_BASE,
) -> A2AClient:
    """
    Create an A2A client instance.

    Args:
        credential_id: Your agent's credential ID.
        api_key: API key for authentication.
        signing_secret: Secret for signing messages.
        api_base: Base URL for AgentID API.

    Returns:
        A2AClient instance.
    """
    return A2AClient(
        credential_id=credential_id,
        api_key=api_key,
        signing_secret=signing_secret,
        api_base=api_base,
    )
