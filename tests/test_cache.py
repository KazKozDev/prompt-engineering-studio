import time
from pathlib import Path

import pytest

from src.utils.cache import ResponseCache


@pytest.fixture
def cache(temp_dir: Path) -> ResponseCache:
    """Provide a cache instance with short TTL."""
    return ResponseCache(cache_dir=str(temp_dir), ttl_seconds=2)


def test_cache_set_and_get(cache: ResponseCache) -> None:
    """Test basic cache set and get."""
    cache.set("prompt", "model", "response")
    result = cache.get("prompt", "model")
    assert result == "response"


def test_cache_miss(cache: ResponseCache) -> None:
    """Test cache miss returns None."""
    result = cache.get("nonexistent", "model")
    assert result is None


def test_cache_expiration(cache: ResponseCache) -> None:
    """Test that cache entries expire."""
    cache.set("prompt", "model", "response")
    time.sleep(3)
    result = cache.get("prompt", "model")
    assert result is None


def test_cache_different_models(cache: ResponseCache) -> None:
    """Test that different models have separate cache entries."""
    cache.set("prompt", "model_a", "response_a")
    cache.set("prompt", "model_b", "response_b")

    assert cache.get("prompt", "model_a") == "response_a"
    assert cache.get("prompt", "model_b") == "response_b"


def test_cache_clear(cache: ResponseCache) -> None:
    """Test clearing all cache entries."""
    cache.set("prompt1", "model", "response1")
    cache.set("prompt2", "model", "response2")

    count = cache.clear()
    assert count == 2
    assert cache.get("prompt1", "model") is None


def test_cache_overwrite(cache: ResponseCache) -> None:
    """Test that setting same key overwrites value."""
    cache.set("prompt", "model", "response1")
    cache.set("prompt", "model", "response2")
    assert cache.get("prompt", "model") == "response2"
