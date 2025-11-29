from abc import ABC, abstractmethod
from typing import Any


class BaseLLMClient(ABC):
    """Abstract base class for LLM clients."""

    def __init__(self, config: dict[str, Any]) -> None:
        """Initialize the LLM client.

        Args:
            config: Configuration dictionary with model parameters.
        """
        self.config = config
        self.model_name = config.get("model_name")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)

    @abstractmethod
    def complete(self, prompt: str, **kwargs: Any) -> str:
        """Generate a completion for the given prompt.

        Args:
            prompt: The input prompt.
            **kwargs: Additional model parameters.

        Returns:
            The generated text.
        """
        pass

    @abstractmethod
    def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        """Generate a response for a chat conversation.

        Args:
            messages: List of message dictionaries with 'role' and 'content'.
            **kwargs: Additional model parameters.

        Returns:
            The assistant's response.
        """
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens in the given text.

        Args:
            text: The text to tokenize.

        Returns:
            Number of tokens.
        """
        pass
