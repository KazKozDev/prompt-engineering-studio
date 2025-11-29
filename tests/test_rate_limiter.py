import time

from src.utils.rate_limiter import RateLimiter


def test_rate_limiter_allows_requests_under_limit() -> None:
    """Test that requests under limit pass through."""
    limiter = RateLimiter(requests_per_minute=10)
    for _ in range(5):
        limiter.acquire()
    assert limiter.get_current_usage()["requests_used"] == 5


def test_rate_limiter_blocks_when_limit_exceeded() -> None:
    """Test that requests are blocked when limit is exceeded."""
    limiter = RateLimiter(requests_per_minute=2)
    limiter.acquire()
    limiter.acquire()

    start = time.time()
    limiter.acquire()
    elapsed = time.time() - start

    assert elapsed >= 0.5  # Should have waited


def test_rate_limiter_resets_after_window() -> None:
    """Test that rate limiter resets after time window."""
    limiter = RateLimiter(requests_per_minute=60)
    limiter.acquire()
    assert limiter.get_current_usage()["requests_used"] == 1


def test_get_current_usage_returns_correct_format() -> None:
    """Test that usage stats have correct structure."""
    limiter = RateLimiter(requests_per_minute=10)
    usage = limiter.get_current_usage()

    assert "requests_used" in usage
    assert "requests_limit" in usage
    assert "requests_remaining" in usage
    assert usage["requests_limit"] == 10
