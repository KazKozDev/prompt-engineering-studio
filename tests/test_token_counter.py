from src.utils.token_counter import TokenCounter


def test_count_empty_string() -> None:
    """Test counting tokens in empty string."""
    counter = TokenCounter()
    assert counter.count("") == 0


def test_count_simple_text() -> None:
    """Test counting tokens in simple text."""
    counter = TokenCounter()
    count = counter.count("Hello world")
    assert count > 0
    assert isinstance(count, int)


def test_truncate_under_limit() -> None:
    """Test truncation when under token limit."""
    counter = TokenCounter()
    text = "Short text"
    result = counter.truncate(text, max_tokens=100)
    assert result == text


def test_truncate_over_limit() -> None:
    """Test truncation when over token limit."""
    counter = TokenCounter()
    text = "This is a longer text that should be truncated"
    result = counter.truncate(text, max_tokens=5)
    assert counter.count(result) <= 5


def test_split_by_tokens() -> None:
    """Test splitting text by token count."""
    counter = TokenCounter()
    text = "One two three four five six seven eight nine ten"
    chunks = counter.split_by_tokens(text, chunk_size=3)
    assert len(chunks) > 1
    for chunk in chunks:
        assert counter.count(chunk) <= 3


def test_split_by_tokens_single_chunk() -> None:
    """Test splitting when text fits in one chunk."""
    counter = TokenCounter()
    text = "Short"
    chunks = counter.split_by_tokens(text, chunk_size=100)
    assert len(chunks) == 1
