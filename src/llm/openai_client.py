"""OpenAI LLM client for PE Studio."""

import os
from typing import Optional
from openai import OpenAI

from src.utils.logger import get_logger

logger = get_logger(__name__)


class OpenAIClient:
    """Client for OpenAI API."""
    
    def __init__(self, config: dict = None, api_key: Optional[str] = None):
        """Initialize OpenAI client.
        
        Args:
            config: Configuration dictionary with model settings
            api_key: OpenAI API key (falls back to OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.config = config or {}
        self.default_model = self.config.get("model_name", "gpt-5-mini")
        
        logger.info(f"OpenAI client initialized with model: {self.default_model}")
    
    def complete(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> str:
        """Generate completion for a prompt.
        
        Args:
            prompt: The prompt to complete
            model: Model to use (defaults to config model)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        model = model or self.default_model
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI completion error: {e}")
            raise
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count for text.
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Estimated token count
        """
        # Rough estimation: ~4 chars per token
        return len(text) // 4
    
    def get_available_models(self) -> list:
        """Get list of available models.
        
        Returns:
            List of model names
        """
        return ["gpt-5-mini"]
