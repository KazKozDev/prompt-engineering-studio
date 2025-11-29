import time
from collections import deque
from threading import Lock
from typing import Any


class RateLimiter:
    """Rate limiter using sliding window algorithm."""

    def __init__(self, requests_per_minute: int) -> None:
        """Initialize the rate limiter.

        Args:
            requests_per_minute: Maximum allowed requests per minute.
        """
        self.rpm = requests_per_minute
        self.timestamps: deque[float] = deque()
        self.lock = Lock()

    def acquire(self) -> None:
        """Acquire permission to make a request, blocking if necessary."""
        with self.lock:
            now = time.time()
            while self.timestamps and self.timestamps[0] < now - 60:
                self.timestamps.popleft()

            if len(self.timestamps) >= self.rpm:
                sleep_time = 60 - (now - self.timestamps[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)

            self.timestamps.append(time.time())

    def get_current_usage(self) -> dict[str, Any]:
        """Get current rate limit usage statistics.

        Returns:
            Dictionary with usage stats.
        """
        with self.lock:
            now = time.time()
            while self.timestamps and self.timestamps[0] < now - 60:
                self.timestamps.popleft()
            return {
                "requests_used": len(self.timestamps),
                "requests_limit": self.rpm,
                "requests_remaining": self.rpm - len(self.timestamps),
            }
