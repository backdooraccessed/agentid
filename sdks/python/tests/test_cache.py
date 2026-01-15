"""Tests for credential caching."""

import time

import pytest

from agentid.cache import CacheEntry, CredentialCache, get_global_cache


class TestCacheEntry:
    """Tests for CacheEntry."""

    def test_is_expired_false_when_valid(self):
        """Test is_expired returns False for valid entry."""
        entry = CacheEntry(
            value={"test": "data"},
            expires_at=time.time() + 100,
        )
        assert entry.is_expired() is False

    def test_is_expired_true_when_expired(self):
        """Test is_expired returns True for expired entry."""
        entry = CacheEntry(
            value={"test": "data"},
            expires_at=time.time() - 1,
        )
        assert entry.is_expired() is True

    def test_time_to_live(self):
        """Test time_to_live calculation."""
        ttl = 100
        entry = CacheEntry(
            value={"test": "data"},
            expires_at=time.time() + ttl,
        )
        assert 99 <= entry.time_to_live() <= 100

    def test_time_to_live_zero_when_expired(self):
        """Test time_to_live is 0 for expired entry."""
        entry = CacheEntry(
            value={"test": "data"},
            expires_at=time.time() - 10,
        )
        assert entry.time_to_live() == 0


class TestCredentialCache:
    """Tests for CredentialCache."""

    @pytest.fixture
    def cache(self):
        """Create a fresh cache for each test."""
        return CredentialCache(default_ttl=60.0)

    def test_set_and_get(self, cache):
        """Test basic set and get."""
        cache.set("key1", {"value": "test"})
        result = cache.get("key1")
        assert result == {"value": "test"}

    def test_get_nonexistent_key(self, cache):
        """Test getting non-existent key returns None."""
        result = cache.get("nonexistent")
        assert result is None

    def test_get_expired_key(self, cache):
        """Test getting expired key returns None."""
        cache.set("key1", {"value": "test"}, ttl=0.001)
        time.sleep(0.01)
        result = cache.get("key1")
        assert result is None

    def test_set_with_custom_ttl(self, cache):
        """Test setting with custom TTL."""
        cache.set("key1", {"value": "test"}, ttl=0.1)
        assert cache.get("key1") is not None

        time.sleep(0.15)
        assert cache.get("key1") is None

    def test_delete(self, cache):
        """Test deleting a key."""
        cache.set("key1", {"value": "test"})
        assert cache.delete("key1") is True
        assert cache.get("key1") is None

    def test_delete_nonexistent(self, cache):
        """Test deleting non-existent key."""
        assert cache.delete("nonexistent") is False

    def test_clear(self, cache):
        """Test clearing the cache."""
        cache.set("key1", {"value": "1"})
        cache.set("key2", {"value": "2"})
        cache.set("key3", {"value": "3"})

        cache.clear()
        assert cache.size() == 0

    def test_cleanup_expired(self, cache):
        """Test cleaning up expired entries."""
        cache.set("key1", {"value": "1"}, ttl=0.001)
        cache.set("key2", {"value": "2"}, ttl=0.001)
        cache.set("key3", {"value": "3"}, ttl=100)

        time.sleep(0.01)

        removed = cache.cleanup_expired()
        assert removed == 2
        assert cache.size() == 1
        assert cache.get("key3") is not None

    def test_size(self, cache):
        """Test size method."""
        assert cache.size() == 0

        cache.set("key1", {"value": "1"})
        assert cache.size() == 1

        cache.set("key2", {"value": "2"})
        assert cache.size() == 2

    def test_get_ttl(self, cache):
        """Test getting TTL for a key."""
        cache.set("key1", {"value": "test"}, ttl=100)

        ttl = cache.get_ttl("key1")
        assert ttl is not None
        assert 99 <= ttl <= 100

    def test_get_ttl_nonexistent(self, cache):
        """Test getting TTL for non-existent key."""
        assert cache.get_ttl("nonexistent") is None

    def test_get_ttl_expired(self, cache):
        """Test getting TTL for expired key."""
        cache.set("key1", {"value": "test"}, ttl=0.001)
        time.sleep(0.01)
        assert cache.get_ttl("key1") is None

    def test_thread_safety(self, cache):
        """Test thread safety of cache operations."""
        import threading

        errors = []

        def writer():
            try:
                for i in range(100):
                    cache.set(f"key_{i}", {"value": i})
            except Exception as e:
                errors.append(e)

        def reader():
            try:
                for i in range(100):
                    cache.get(f"key_{i}")
            except Exception as e:
                errors.append(e)

        threads = [
            threading.Thread(target=writer),
            threading.Thread(target=writer),
            threading.Thread(target=reader),
            threading.Thread(target=reader),
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0


class TestGlobalCache:
    """Tests for global cache."""

    def test_get_global_cache_singleton(self):
        """Test that get_global_cache returns singleton."""
        cache1 = get_global_cache()
        cache2 = get_global_cache()
        assert cache1 is cache2

    def test_global_cache_is_credential_cache(self):
        """Test that global cache is CredentialCache instance."""
        cache = get_global_cache()
        assert isinstance(cache, CredentialCache)
