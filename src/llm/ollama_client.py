import requests
from typing import List, Dict, Any, Optional
from src.llm.base import BaseLLMClient


class OllamaClient(BaseLLMClient):
    """Client for Ollama API."""

    def __init__(self, config: Dict[str, Any]) -> None:
        """Initialize Ollama client.

        Args:
            config: Configuration dictionary.
        """
        super().__init__(config)
        self.base_url = config.get("base_url", "http://localhost:11434")

    def complete(self, prompt: str, **kwargs: Any) -> str:
        """Generate completion using Ollama.

        Args:
            prompt: Input prompt.
            **kwargs: Additional args.

        Returns:
            Generated text.
        """
        model = kwargs.get("model", self.model_name)
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
            }
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Ollama API error: {e}")

    def chat(self, messages: List[Dict[str, str]], **kwargs: Any) -> str:
        """Generate chat response using Ollama.

        Args:
            messages: Chat history.
            **kwargs: Additional args.

        Returns:
            Assistant response.
        """
        # Ollama /api/chat endpoint
        model = kwargs.get("model", self.model_name)
        url = f"{self.base_url}/api/chat"
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
            }
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json().get("message", {}).get("content", "")
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Ollama API error: {e}")

    def count_tokens(self, text: str) -> int:
        """Count tokens (approximation).

        Args:
            text: Input text.

        Returns:
            Token count (approximate).
        """
        # Ollama doesn't have a direct token count endpoint easily accessible without model context
        # Using a simple approximation or tiktoken if needed. 
        # For now, let's use a rough char/4 estimate or return 0 if not critical.
        return len(text) // 4
    
    def get_available_models(self) -> List[str]:
        """Get list of available Ollama models.

        Returns:
            List of model names.
        """
        url = f"{self.base_url}/api/tags"
        try:
            response = requests.get(url)
            response.raise_for_status()
            models = response.json().get("models", [])
            return [m["name"] for m in models]
        except requests.exceptions.RequestException:
            return []
