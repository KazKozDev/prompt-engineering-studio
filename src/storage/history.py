"""History storage module for PE Studio.

This module handles saving and retrieving generation history.
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class HistoryManager:
    """Manages generation history storage."""

    def __init__(self, storage_dir: str = "data/history") -> None:
        """Initialize history manager.

        Args:
            storage_dir: Directory to store history files.
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def save_generation(
        self,
        prompt: str,
        provider: str,
        model: str,
        techniques: List[str],
        results: List[Dict[str, Any]],
    ) -> str:
        """Save a generation to history.

        Args:
            prompt: User's input prompt.
            provider: LLM provider used.
            model: Model name used.
            techniques: List of technique keys used.
            results: Generation results.

        Returns:
            ID of the saved generation.
        """
        timestamp = datetime.now()
        generation_id = timestamp.strftime("%Y%m%d_%H%M%S")

        history_entry = {
            "id": generation_id,
            "timestamp": timestamp.isoformat(),
            "prompt": prompt,
            "provider": provider,
            "model": model,
            "techniques": techniques,
            "results": results,
            "total_tokens": sum(r.get("tokens", 0) for r in results),
        }

        file_path = self.storage_dir / f"{generation_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(history_entry, f, indent=2, ensure_ascii=False)

        return generation_id

    def get_all_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all history entries.

        Args:
            limit: Maximum number of entries to return (most recent first).

        Returns:
            List of history entries.
        """
        history_files = sorted(
            self.storage_dir.glob("*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        if limit:
            history_files = history_files[:limit]

        history = []
        for file_path in history_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    history.append(json.load(f))
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                continue

        return history

    def get_generation(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific generation by ID.

        Args:
            generation_id: ID of the generation.

        Returns:
            Generation data or None if not found.
        """
        file_path = self.storage_dir / f"{generation_id}.json"
        if not file_path.exists():
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def delete_generation(self, generation_id: str) -> bool:
        """Delete a generation from history.

        Args:
            generation_id: ID of the generation to delete.

        Returns:
            True if deleted, False if not found.
        """
        file_path = self.storage_dir / f"{generation_id}.json"
        if not file_path.exists():
            return False

        file_path.unlink()
        return True

    def clear_all(self) -> int:
        """Clear all history.

        Returns:
            Number of entries deleted.
        """
        count = 0
        for file_path in self.storage_dir.glob("*.json"):
            file_path.unlink()
            count += 1
        return count

    def get_stats(self) -> Dict[str, Any]:
        """Get history statistics.

        Returns:
            Dictionary with statistics.
        """
        history = self.get_all_history()

        if not history:
            return {
                "total_generations": 0,
                "total_tokens": 0,
                "providers": {},
                "techniques": {},
            }

        providers: Dict[str, int] = {}
        techniques: Dict[str, int] = {}
        total_tokens = 0

        for entry in history:
            # Count providers
            provider = entry.get("provider", "unknown")
            providers[provider] = providers.get(provider, 0) + 1

            # Count techniques
            for tech in entry.get("techniques", []):
                techniques[tech] = techniques.get(tech, 0) + 1

            # Sum tokens
            total_tokens += entry.get("total_tokens", 0)

        return {
            "total_generations": len(history),
            "total_tokens": total_tokens,
            "providers": providers,
            "techniques": techniques,
            "most_used_technique": max(techniques.items(), key=lambda x: x[1])[0]
            if techniques
            else None,
        }
