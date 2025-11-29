import tiktoken


class TokenCounter:
    """Utility for counting and managing tokens."""

    def __init__(self, model: str = "cl100k_base") -> None:
        """Initialize the token counter.

        Args:
            model: The tokenizer model to use.
        """
        self.encoder = tiktoken.get_encoding(model)

    def count(self, text: str) -> int:
        """Count tokens in text.

        Args:
            text: The input text.

        Returns:
            Number of tokens.
        """
        return len(self.encoder.encode(text))

    def truncate(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit.

        Args:
            text: The input text.
            max_tokens: Maximum number of tokens.

        Returns:
            Truncated text.
        """
        tokens = self.encoder.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return self.encoder.decode(tokens[:max_tokens])

    def split_by_tokens(self, text: str, chunk_size: int) -> list[str]:
        """Split text into chunks by token count.

        Args:
            text: The input text.
            chunk_size: Maximum tokens per chunk.

        Returns:
            List of text chunks.
        """
        tokens = self.encoder.encode(text)
        chunks = []
        for i in range(0, len(tokens), chunk_size):
            chunk_tokens = tokens[i : i + chunk_size]
            chunks.append(self.encoder.decode(chunk_tokens))
        return chunks
