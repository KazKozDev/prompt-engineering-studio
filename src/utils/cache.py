import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path


class ResponseCache:
    """File-based cache for LLM responses."""

    def __init__(self, cache_dir: str, ttl_seconds: int = 3600) -> None:
        """Initialize the cache.

        Args:
            cache_dir: Directory to store cache files.
            ttl_seconds: Time-to-live for cache entries in seconds.
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = timedelta(seconds=ttl_seconds)

    def _hash_key(self, prompt: str, model: str) -> str:
        """Generate a hash key for the cache entry.

        Args:
            prompt: The prompt text.
            model: The model name.

        Returns:
            SHA256 hash string.
        """
        content = f"{model}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, prompt: str, model: str) -> str | None:
        """Retrieve a cached response.

        Args:
            prompt: The prompt text.
            model: The model name.

        Returns:
            Cached response or None if not found/expired.
        """
        key = self._hash_key(prompt, model)
        path = self.cache_dir / f"{key}.json"

        if not path.exists():
            return None

        data = json.loads(path.read_text())
        cached_time = datetime.fromisoformat(data["timestamp"])

        if datetime.now() - cached_time > self.ttl:
            path.unlink()
            return None

        return data["response"]

    def set(self, prompt: str, model: str, response: str) -> None:
        """Store a response in cache.

        Args:
            prompt: The prompt text.
            model: The model name.
            response: The response to cache.
        """
        key = self._hash_key(prompt, model)
        path = self.cache_dir / f"{key}.json"

        data = {
            "timestamp": datetime.now().isoformat(),
            "response": response,
        }
        path.write_text(json.dumps(data))

    def clear(self) -> int:
        """Clear all cache entries.

        Returns:
            Number of entries cleared.
        """
        count = 0
        for path in self.cache_dir.glob("*.json"):
            path.unlink()
            count += 1
        return count
