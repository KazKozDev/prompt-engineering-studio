import google.generativeai as genai
from typing import List, Dict, Any
from src.llm.base import BaseLLMClient


class GeminiClient(BaseLLMClient):
    """Client for Google Gemini API."""

    def __init__(self, config: Dict[str, Any], api_key: str) -> None:
        """Initialize Gemini client.

        Args:
            config: Configuration dictionary.
            api_key: Google API Key.
        """
        super().__init__(config)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.model_name)

    def complete(self, prompt: str, **kwargs: Any) -> str:
        """Generate completion using Gemini.

        Args:
            prompt: Input prompt.
            **kwargs: Additional args.

        Returns:
            Generated text.
        """
        generation_config = genai.types.GenerationConfig(
            temperature=kwargs.get("temperature", self.temperature),
            max_output_tokens=kwargs.get("max_tokens", self.max_tokens),
        )
        
        try:
            response = self.model.generate_content(
                prompt, 
                generation_config=generation_config
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}")

    def chat(self, messages: List[Dict[str, str]], **kwargs: Any) -> str:
        """Generate chat response using Gemini.

        Args:
            messages: Chat history.
            **kwargs: Additional args.

        Returns:
            Assistant response.
        """
        # Convert standard messages format to Gemini format if needed
        # Simple implementation: concatenate or use start_chat
        chat = self.model.start_chat(history=[])
        last_message = messages[-1]["content"]
        
        try:
            response = chat.send_message(last_message)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}")

    def count_tokens(self, text: str) -> int:
        """Count tokens using Gemini API.

        Args:
            text: Input text.

        Returns:
            Token count.
        """
        try:
            return self.model.count_tokens(text).total_tokens
        except Exception:
            return len(text) // 4
