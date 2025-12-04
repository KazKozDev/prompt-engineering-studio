"""
Response Cache for Evaluation.

Caches LLM responses to avoid redundant API calls during evaluation.
Significantly speeds up iterative evaluation and reduces costs.
"""

import json
import hashlib
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime, timedelta


class ResponseCache:
    """
    Cache for LLM responses during evaluation.
    
    Features:
    - Hash-based caching (prompt + model + settings)
    - TTL support
    - Disk persistence
    - Cache statistics
    """
    
    def __init__(
        self,
        cache_dir: str = "data/cache/evaluation",
        ttl_hours: int = 24
    ):
        """
        Initialize response cache.
        
        Args:
            cache_dir: Directory to store cache files
            ttl_hours: Time-to-live for cache entries (hours)
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.ttl_hours = ttl_hours
        self.stats = {
            "hits": 0,
            "misses": 0,
            "saves": 0
        }
        
        # In-memory cache for current session
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
    
    def _generate_key(
        self,
        prompt: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        **kwargs
    ) -> str:
        """
        Generate cache key from parameters.
        
        Args:
            prompt: Prompt text
            model: Model name
            provider: Provider name
            temperature: Temperature setting
            **kwargs: Additional parameters
        
        Returns:
            Cache key (SHA256 hash)
        """
        # Create deterministic string from parameters
        cache_input = json.dumps({
            "prompt": prompt,
            "model": model,
            "provider": provider,
            "temperature": temperature,
            **kwargs
        }, sort_keys=True)
        
        # Generate hash
        return hashlib.sha256(cache_input.encode()).hexdigest()
    
    def _get_cache_file(self, key: str) -> Path:
        """Get cache file path for a key."""
        # Use first 2 chars for subdirectory to avoid too many files in one dir
        subdir = self.cache_dir / key[:2]
        subdir.mkdir(exist_ok=True)
        return subdir / f"{key}.json"
    
    def _is_expired(self, timestamp: str) -> bool:
        """Check if cache entry is expired."""
        if not timestamp:
            return True
        
        cached_time = datetime.fromisoformat(timestamp)
        expiry_time = cached_time + timedelta(hours=self.ttl_hours)
        
        return datetime.now() > expiry_time
    
    def get(
        self,
        prompt: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        **kwargs
    ) -> Optional[str]:
        """
        Get cached response.
        
        Args:
            prompt: Prompt text
            model: Model name
            provider: Provider name
            temperature: Temperature setting
            **kwargs: Additional parameters
        
        Returns:
            Cached response or None if not found/expired
        """
        key = self._generate_key(prompt, model, provider, temperature, **kwargs)
        
        # Check memory cache first
        if key in self.memory_cache:
            entry = self.memory_cache[key]
            if not self._is_expired(entry.get("timestamp", "")):
                self.stats["hits"] += 1
                return entry["response"]
            else:
                # Remove expired entry
                del self.memory_cache[key]
        
        # Check disk cache
        cache_file = self._get_cache_file(key)
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    entry = json.load(f)
                
                if not self._is_expired(entry.get("timestamp", "")):
                    # Load into memory cache
                    self.memory_cache[key] = entry
                    self.stats["hits"] += 1
                    return entry["response"]
                else:
                    # Remove expired file
                    cache_file.unlink()
            except Exception:
                pass
        
        self.stats["misses"] += 1
        return None
    
    def set(
        self,
        prompt: str,
        model: str,
        provider: str,
        response: str,
        temperature: float = 0.0,
        **kwargs
    ) -> None:
        """
        Cache a response.
        
        Args:
            prompt: Prompt text
            model: Model name
            provider: Provider name
            response: Response to cache
            temperature: Temperature setting
            **kwargs: Additional parameters
        """
        key = self._generate_key(prompt, model, provider, temperature, **kwargs)
        
        entry = {
            "prompt": prompt,
            "model": model,
            "provider": provider,
            "temperature": temperature,
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "metadata": kwargs
        }
        
        # Save to memory cache
        self.memory_cache[key] = entry
        
        # Save to disk cache
        cache_file = self._get_cache_file(key)
        try:
            with open(cache_file, 'w') as f:
                json.dump(entry, f, indent=2)
            self.stats["saves"] += 1
        except Exception:
            pass
    
    def clear(self) -> int:
        """
        Clear all cache entries.
        
        Returns:
            Number of entries cleared
        """
        count = 0
        
        # Clear memory cache
        count += len(self.memory_cache)
        self.memory_cache.clear()
        
        # Clear disk cache
        for cache_file in self.cache_dir.rglob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except Exception:
                pass
        
        return count
    
    def clear_expired(self) -> int:
        """
        Clear expired cache entries.
        
        Returns:
            Number of entries cleared
        """
        count = 0
        
        # Clear expired from memory
        expired_keys = []
        for key, entry in self.memory_cache.items():
            if self._is_expired(entry.get("timestamp", "")):
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.memory_cache[key]
            count += 1
        
        # Clear expired from disk
        for cache_file in self.cache_dir.rglob("*.json"):
            try:
                with open(cache_file, 'r') as f:
                    entry = json.load(f)
                
                if self._is_expired(entry.get("timestamp", "")):
                    cache_file.unlink()
                    count += 1
            except Exception:
                pass
        
        return count
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = self.stats["hits"] / total_requests if total_requests > 0 else 0.0
        
        # Count disk cache entries
        disk_entries = len(list(self.cache_dir.rglob("*.json")))
        
        return {
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "saves": self.stats["saves"],
            "hit_rate": round(hit_rate, 4),
            "memory_entries": len(self.memory_cache),
            "disk_entries": disk_entries,
            "ttl_hours": self.ttl_hours
        }
    
    def get_size(self) -> Dict[str, Any]:
        """
        Get cache size information.
        
        Returns:
            Dictionary with size info
        """
        total_size = 0
        file_count = 0
        
        for cache_file in self.cache_dir.rglob("*.json"):
            try:
                total_size += cache_file.stat().st_size
                file_count += 1
            except Exception:
                pass
        
        return {
            "total_bytes": total_size,
            "total_mb": round(total_size / (1024 * 1024), 2),
            "file_count": file_count,
            "avg_file_size_bytes": total_size // file_count if file_count > 0 else 0
        }
