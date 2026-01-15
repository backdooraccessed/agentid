"""Credential caching for AgentID SDK."""

import threading
import time
from dataclasses import dataclass, field
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    """A cached value with expiration."""

    value: T
    expires_at: float
    created_at: float = field(default_factory=time.time)

    def is_expired(self) -> bool:
        """Check if this entry has expired."""
        return time.time() >= self.expires_at

    def time_to_live(self) -> float:
        """Get remaining time to live in seconds."""
        return max(0, self.expires_at - time.time())


class CredentialCache:
    """
    Thread-safe in-memory cache for credentials.

    This cache stores credential data with automatic expiration
    and provides thread-safe access.
    """

    def __init__(self, default_ttl: float = 300.0) -> None:
        """
        Initialize the cache.

        Args:
            default_ttl: Default time-to-live in seconds (default 5 minutes)
        """
        self._cache: dict[str, CacheEntry[dict]] = {}
        self._lock = threading.RLock()
        self._default_ttl = default_ttl

    def get(self, key: str) -> dict | None:
        """
        Get a value from the cache.

        Args:
            key: The cache key

        Returns:
            The cached value, or None if not found or expired
        """
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            if entry.is_expired():
                del self._cache[key]
                return None
            return entry.value

    def set(
        self,
        key: str,
        value: dict,
        ttl: float | None = None,
    ) -> None:
        """
        Set a value in the cache.

        Args:
            key: The cache key
            value: The value to cache
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        if ttl is None:
            ttl = self._default_ttl

        with self._lock:
            self._cache[key] = CacheEntry(
                value=value,
                expires_at=time.time() + ttl,
            )

    def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.

        Args:
            key: The cache key

        Returns:
            True if the key was found and deleted, False otherwise
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self) -> int:
        """
        Remove all expired entries from the cache.

        Returns:
            Number of entries removed
        """
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items() if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)

    def size(self) -> int:
        """Get the number of entries in the cache."""
        with self._lock:
            return len(self._cache)

    def get_ttl(self, key: str) -> float | None:
        """
        Get the remaining TTL for a key.

        Args:
            key: The cache key

        Returns:
            Remaining TTL in seconds, or None if key not found
        """
        with self._lock:
            entry = self._cache.get(key)
            if entry is None or entry.is_expired():
                return None
            return entry.time_to_live()


# Global cache instance
_global_cache: CredentialCache | None = None
_cache_lock = threading.Lock()


def get_global_cache() -> CredentialCache:
    """Get or create the global credential cache."""
    global _global_cache
    if _global_cache is None:
        with _cache_lock:
            if _global_cache is None:
                _global_cache = CredentialCache()
    return _global_cache
