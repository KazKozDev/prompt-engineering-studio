"""Templates storage module for PE Studio.

This module handles saving and retrieving prompt templates.
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class TemplatesManager:
    """Manages prompt templates storage."""

    def __init__(self, storage_dir: str = "data/templates") -> None:
        """Initialize templates manager.

        Args:
            storage_dir: Directory to store template files.
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.templates_file = self.storage_dir / "templates.json"
        self._ensure_file_exists()

    def _ensure_file_exists(self) -> None:
        """Ensure templates file exists."""
        if not self.templates_file.exists():
            self.templates_file.write_text(json.dumps([], indent=2))

    def _load_templates(self) -> List[Dict[str, Any]]:
        """Load all templates from file."""
        with open(self.templates_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_templates(self, templates: List[Dict[str, Any]]) -> None:
        """Save templates to file."""
        with open(self.templates_file, "w", encoding="utf-8") as f:
            json.dump(templates, f, indent=2, ensure_ascii=False)

    def create_template(
        self,
        name: str,
        prompt: str,
        description: str = "",
        category: str = "General",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Create a new template.

        Args:
            name: Template name.
            prompt: Template prompt text.
            description: Template description.
            category: Template category.
            tags: List of tags.

        Returns:
            Created template.
        """
        templates = self._load_templates()

        template = {
            "id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "name": name,
            "prompt": prompt,
            "description": description,
            "category": category,
            "tags": tags or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "usage_count": 0,
        }

        templates.append(template)
        self._save_templates(templates)

        return template

    def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all templates.

        Returns:
            List of templates.
        """
        return self._load_templates()

    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific template by ID.

        Args:
            template_id: ID of the template.

        Returns:
            Template data or None if not found.
        """
        templates = self._load_templates()
        for template in templates:
            if template["id"] == template_id:
                return template
        return None

    def update_template(
        self,
        template_id: str,
        name: Optional[str] = None,
        prompt: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update a template.

        Args:
            template_id: ID of the template to update.
            name: New name (optional).
            prompt: New prompt (optional).
            description: New description (optional).
            category: New category (optional).
            tags: New tags (optional).

        Returns:
            Updated template or None if not found.
        """
        templates = self._load_templates()

        for template in templates:
            if template["id"] == template_id:
                if name is not None:
                    template["name"] = name
                if prompt is not None:
                    template["prompt"] = prompt
                if description is not None:
                    template["description"] = description
                if category is not None:
                    template["category"] = category
                if tags is not None:
                    template["tags"] = tags

                template["updated_at"] = datetime.now().isoformat()

                self._save_templates(templates)
                return template

        return None

    def delete_template(self, template_id: str) -> bool:
        """Delete a template.

        Args:
            template_id: ID of the template to delete.

        Returns:
            True if deleted, False if not found.
        """
        templates = self._load_templates()
        initial_count = len(templates)

        templates = [t for t in templates if t["id"] != template_id]

        if len(templates) < initial_count:
            self._save_templates(templates)
            return True

        return False

    def increment_usage(self, template_id: str) -> None:
        """Increment usage count for a template.

        Args:
            template_id: ID of the template.
        """
        templates = self._load_templates()

        for template in templates:
            if template["id"] == template_id:
                template["usage_count"] = template.get("usage_count", 0) + 1
                self._save_templates(templates)
                break

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get templates by category.

        Args:
            category: Category name.

        Returns:
            List of templates in the category.
        """
        templates = self._load_templates()
        return [t for t in templates if t.get("category") == category]

    def search_templates(self, query: str) -> List[Dict[str, Any]]:
        """Search templates by name or description.

        Args:
            query: Search query.

        Returns:
            List of matching templates.
        """
        templates = self._load_templates()
        query_lower = query.lower()

        return [
            t
            for t in templates
            if query_lower in t.get("name", "").lower()
            or query_lower in t.get("description", "").lower()
            or any(query_lower in tag.lower() for tag in t.get("tags", []))
        ]
