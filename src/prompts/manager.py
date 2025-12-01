import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional


class PromptManager:
    """Manages prompt templates and techniques."""

    def __init__(
        self,
        config_path: str = "config/prompts.yaml",
        templates_path: str = "config/technique_templates.yaml",
    ) -> None:
        """Initialize PromptManager.

        Args:
            config_path: Path to prompts configuration file.
            templates_path: Path to technique templates file.
        """
        self.config_path = Path(config_path)
        self.templates_path = Path(templates_path)
        self.config = self._load_config()
        self.technique_templates = self._load_templates()
        self.techniques = self.config.get("techniques", {})
        self.meta_prompt_template = self.config.get("meta_prompt", "")

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file.

        Returns:
            Configuration dictionary.
        """
        if not self.config_path.exists():
            return {}
        with open(self.config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _load_templates(self) -> Dict[str, Any]:
        """Load technique-specific templates from YAML file.

        Returns:
            Templates dictionary.
        """
        if not self.templates_path.exists():
            return {}
        with open(self.templates_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("templates", {})

    def get_technique(self, key: str) -> Optional[Dict[str, str]]:
        """Get technique details by key.

        Args:
            key: Technique key.

        Returns:
            Technique dictionary or None.
        """
        return self.techniques.get(key)

    def get_all_techniques(self) -> Dict[str, Dict[str, str]]:
        """Get all available techniques.

        Returns:
            Dictionary of techniques.
        """
        return self.techniques

    def generate_meta_prompt(self, user_input: str, technique_key: str) -> str:
        """Generate the meta-prompt for a specific technique.

        Uses technique-specific templates based on arXiv papers when available,
        falls back to generic meta-prompt template otherwise.

        Args:
            user_input: The user's original query.
            technique_key: The key of the selected technique.

        Returns:
            Formatted meta-prompt string following the technique's methodology.
        """
        technique = self.get_technique(technique_key)
        if not technique:
            raise ValueError(f"Technique '{technique_key}' not found.")

        # Get the template if available
        technique_template = ""
        if technique_key in self.technique_templates:
            template_data = self.technique_templates[technique_key]
            technique_template = template_data.get("template", "")

        # Format the meta-prompt
        # We pass the template to the meta-prompt so the LLM can use it as a guide
        return self.meta_prompt_template.format(
            user_input=user_input,
            technique_name=technique["name"],
            technique_description=technique["description"],
            technique_template=technique_template
        )
