"""
Real-time credential revocation subscription.

Enables instant revocation by subscribing to a WebSocket stream
of revocation events, with polling fallback.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

import httpx

from agentid.cache import CredentialCache, get_global_cache

logger = logging.getLogger(__name__)

DEFAULT_API_BASE = "https://agentid.dev/api"
DEFAULT_WS_BASE = "wss://agentid.dev/ws"


class ConnectionState(Enum):
    """Connection state for revocation subscriber."""

    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"


@dataclass
class RevocationEvent:
    """Event emitted when a credential is revoked."""

    credential_id: str
    revoked_at: str
    reason: str | None = None


@dataclass
class RevocationSubscriberConfig:
    """Configuration for RevocationSubscriber."""

    # API endpoints
    api_base: str = DEFAULT_API_BASE
    ws_base: str = DEFAULT_WS_BASE

    # Cache
    cache: CredentialCache | None = None

    # Callbacks
    on_revocation: Callable[[RevocationEvent], None] | None = None
    on_connection_change: Callable[[bool], None] | None = None
    on_error: Callable[[Exception], None] | None = None

    # Polling settings
    poll_interval: float = 30.0  # seconds

    # Reconnection settings
    auto_reconnect: bool = True
    max_reconnect_attempts: int = 10
    reconnect_backoff: float = 1.5
    initial_reconnect_delay: float = 1.0

    # Subscription filter
    credential_ids: list[str] = field(default_factory=list)


class RevocationSubscriber:
    """
    Subscriber for real-time credential revocations.

    Usage:
        subscriber = RevocationSubscriber(
            on_revocation=lambda event: print(f"Revoked: {event.credential_id}")
        )

        # Start listening (async)
        await subscriber.connect()

        # Or sync polling
        subscriber.start_polling()

        # Check if revoked
        if subscriber.is_revoked("cred_xxx"):
            print("Credential was revoked!")

        # Stop
        subscriber.disconnect()
    """

    def __init__(
        self,
        *,
        api_base: str = DEFAULT_API_BASE,
        ws_base: str = DEFAULT_WS_BASE,
        cache: CredentialCache | None = None,
        on_revocation: Callable[[RevocationEvent], None] | None = None,
        on_connection_change: Callable[[bool], None] | None = None,
        on_error: Callable[[Exception], None] | None = None,
        poll_interval: float = 30.0,
        auto_reconnect: bool = True,
        max_reconnect_attempts: int = 10,
        reconnect_backoff: float = 1.5,
        initial_reconnect_delay: float = 1.0,
        credential_ids: list[str] | None = None,
    ) -> None:
        self.api_base = api_base.rstrip("/")
        self.ws_base = ws_base.rstrip("/")
        self.cache = cache or get_global_cache()
        self.on_revocation = on_revocation
        self.on_connection_change = on_connection_change
        self.on_error = on_error
        self.poll_interval = poll_interval
        self.auto_reconnect = auto_reconnect
        self.max_reconnect_attempts = max_reconnect_attempts
        self.reconnect_backoff = reconnect_backoff
        self.initial_reconnect_delay = initial_reconnect_delay
        self.credential_ids: set[str] = set(credential_ids or [])

        # State
        self._state = ConnectionState.DISCONNECTED
        self._reconnect_attempts = 0
        self._reconnect_delay = initial_reconnect_delay
        self._last_revocation_check = 0.0
        self._revoked_credentials: set[str] = set()

        # Tasks
        self._ws_task: asyncio.Task[None] | None = None
        self._poll_task: asyncio.Task[None] | None = None
        self._reconnect_task: asyncio.Task[None] | None = None
        self._stop_event = asyncio.Event()

    @property
    def connection_state(self) -> ConnectionState:
        """Get current connection state."""
        return self._state

    @property
    def is_connected(self) -> bool:
        """Check if connected (WebSocket or polling)."""
        return self._state == ConnectionState.CONNECTED

    def is_revoked(self, credential_id: str) -> bool:
        """Check if a credential is known to be revoked."""
        return credential_id in self._revoked_credentials

    async def connect(self) -> None:
        """
        Connect to the revocation stream (async).

        Attempts WebSocket connection first, falls back to polling.
        """
        if self._state != ConnectionState.DISCONNECTED:
            return

        self._stop_event.clear()
        self._set_state(ConnectionState.CONNECTING)

        # Try WebSocket first
        try:
            await self._connect_websocket()
            return
        except Exception as e:
            self._handle_error(e)

        # Fall back to polling
        await self._start_polling_async()

    def start_polling(self) -> None:
        """Start polling for revocations (sync, runs in background thread)."""
        import threading

        if self._state != ConnectionState.DISCONNECTED:
            return

        self._set_state(ConnectionState.CONNECTED)

        def poll_loop() -> None:
            while self._state == ConnectionState.CONNECTED:
                try:
                    self.check_revocations_sync()
                except Exception as e:
                    self._handle_error(e)
                time.sleep(self.poll_interval)

        thread = threading.Thread(target=poll_loop, daemon=True)
        thread.start()

    def disconnect(self) -> None:
        """Disconnect from the revocation stream."""
        self._stop_event.set()

        # Cancel tasks
        if self._ws_task:
            self._ws_task.cancel()
            self._ws_task = None

        if self._poll_task:
            self._poll_task.cancel()
            self._poll_task = None

        if self._reconnect_task:
            self._reconnect_task.cancel()
            self._reconnect_task = None

        self._set_state(ConnectionState.DISCONNECTED)
        self._reconnect_attempts = 0
        self._reconnect_delay = self.initial_reconnect_delay

    def subscribe(self, credential_id: str) -> None:
        """Subscribe to a specific credential."""
        self.credential_ids.add(credential_id)

    def unsubscribe(self, credential_id: str) -> None:
        """Unsubscribe from a specific credential."""
        self.credential_ids.discard(credential_id)

    async def check_revocations(self) -> list[RevocationEvent]:
        """Check for revocations (async)."""
        events: list[RevocationEvent] = []

        try:
            url = f"{self.api_base}/revocations"
            params: dict[str, Any] = {"since": str(int(self._last_revocation_check * 1000))}

            if self.credential_ids:
                params["credential_ids"] = ",".join(self.credential_ids)

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)

            if response.status_code != 200:
                raise Exception(f"Revocation check failed: {response.status_code}")

            data = response.json()
            self._last_revocation_check = time.time()

            for rev in data.get("revocations", []):
                event = RevocationEvent(
                    credential_id=rev["credential_id"],
                    revoked_at=rev["revoked_at"],
                    reason=rev.get("reason"),
                )
                events.append(event)
                self._handle_revocation_event(event)

        except Exception as e:
            self._handle_error(e)

        return events

    def check_revocations_sync(self) -> list[RevocationEvent]:
        """Check for revocations (sync)."""
        events: list[RevocationEvent] = []

        try:
            url = f"{self.api_base}/revocations"
            params: dict[str, Any] = {"since": str(int(self._last_revocation_check * 1000))}

            if self.credential_ids:
                params["credential_ids"] = ",".join(self.credential_ids)

            response = httpx.get(url, params=params, timeout=30.0)

            if response.status_code != 200:
                raise Exception(f"Revocation check failed: {response.status_code}")

            data = response.json()
            self._last_revocation_check = time.time()

            for rev in data.get("revocations", []):
                event = RevocationEvent(
                    credential_id=rev["credential_id"],
                    revoked_at=rev["revoked_at"],
                    reason=rev.get("reason"),
                )
                events.append(event)
                self._handle_revocation_event(event)

        except Exception as e:
            self._handle_error(e)

        return events

    # Private methods

    async def _connect_websocket(self) -> None:
        """Connect via WebSocket."""
        try:
            import websockets
        except ImportError:
            raise ImportError(
                "websockets is required for WebSocket connections. "
                "Install it with: pip install websockets"
            )

        url = f"{self.ws_base}/revocations"
        if self.credential_ids:
            url += f"?credential_ids={','.join(self.credential_ids)}"

        async with websockets.connect(url) as ws:
            self._set_state(ConnectionState.CONNECTED)
            self._reconnect_attempts = 0
            self._reconnect_delay = self.initial_reconnect_delay

            async def send_pong() -> None:
                while not self._stop_event.is_set():
                    try:
                        message = await asyncio.wait_for(ws.recv(), timeout=60)
                        await self._handle_ws_message(ws, message)
                    except asyncio.TimeoutError:
                        # Send keepalive
                        await ws.send('{"type": "ping"}')
                    except Exception:
                        break

            await send_pong()

    async def _handle_ws_message(self, ws: Any, message: str) -> None:
        """Handle WebSocket message."""
        import json

        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")

        if msg_type == "revocation":
            event_data = data.get("data", {})
            event = RevocationEvent(
                credential_id=event_data.get("credential_id", ""),
                revoked_at=event_data.get("revoked_at", ""),
                reason=event_data.get("reason"),
            )
            self._handle_revocation_event(event)

        elif msg_type == "ping":
            await ws.send('{"type": "pong"}')

        elif msg_type == "error":
            self._handle_error(Exception(data.get("error", "Unknown error")))

    async def _start_polling_async(self) -> None:
        """Start async polling."""
        self._set_state(ConnectionState.CONNECTED)

        # Initial check
        await self.check_revocations()

        # Start polling loop
        async def poll_loop() -> None:
            while not self._stop_event.is_set():
                await asyncio.sleep(self.poll_interval)
                if self._stop_event.is_set():
                    break
                await self.check_revocations()

        self._poll_task = asyncio.create_task(poll_loop())

    def _handle_revocation_event(self, event: RevocationEvent) -> None:
        """Handle a revocation event."""
        # Track revoked credential
        self._revoked_credentials.add(event.credential_id)

        # Clear from cache
        self.cache.delete(f"verify:{event.credential_id}")
        self.cache.delete(f"cred:{event.credential_id}")

        # Notify callback
        if self.on_revocation:
            try:
                self.on_revocation(event)
            except Exception:
                pass

    def _handle_error(self, error: Exception) -> None:
        """Handle an error."""
        logger.warning(f"Revocation subscriber error: {error}")
        if self.on_error:
            try:
                self.on_error(error)
            except Exception:
                pass

    def _set_state(self, state: ConnectionState) -> None:
        """Set connection state and notify."""
        was_connected = self._state == ConnectionState.CONNECTED
        self._state = state
        is_now_connected = state == ConnectionState.CONNECTED

        if was_connected != is_now_connected and self.on_connection_change:
            try:
                self.on_connection_change(is_now_connected)
            except Exception:
                pass


def create_revocation_aware_verifier(
    *,
    api_base: str = DEFAULT_API_BASE,
    cache: CredentialCache | None = None,
    on_revocation: Callable[[RevocationEvent], None] | None = None,
    subscribe_revocations: bool = True,
    **verifier_kwargs: Any,
) -> tuple[Any, RevocationSubscriber | None]:
    """
    Create a verifier with revocation subscription.

    Usage:
        from agentid.revocation import create_revocation_aware_verifier

        verifier, subscriber = create_revocation_aware_verifier(
            on_revocation=lambda event: print(f"Revoked: {event.credential_id}")
        )

        # Start listening (run in async context)
        await subscriber.connect()

        # Verify
        result = verifier.verify_credential("cred_xxx")

    Returns:
        Tuple of (CredentialVerifier, RevocationSubscriber or None)
    """
    from agentid.verifier import CredentialVerifier

    cache = cache or get_global_cache()

    verifier = CredentialVerifier(
        api_base=api_base,
        cache=cache,
        **verifier_kwargs,
    )

    subscriber: RevocationSubscriber | None = None

    if subscribe_revocations:
        subscriber = RevocationSubscriber(
            api_base=api_base,
            cache=cache,
            on_revocation=on_revocation,
        )

    return verifier, subscriber
