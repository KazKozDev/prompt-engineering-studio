import pytest

from src.handlers.error_handler import APIError, RateLimitError, retry_on_error


def test_retry_succeeds_first_attempt() -> None:
    """Test function that succeeds on first attempt."""
    call_count = 0

    @retry_on_error(max_retries=3)
    def always_works() -> str:
        nonlocal call_count
        call_count += 1
        return "success"

    result = always_works()
    assert result == "success"
    assert call_count == 1


def test_retry_succeeds_after_failures() -> None:
    """Test function that succeeds after retries."""
    call_count = 0

    @retry_on_error(max_retries=3, delay=0.1)
    def fails_twice() -> str:
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ValueError("temporary error")
        return "success"

    result = fails_twice()
    assert result == "success"
    assert call_count == 3


def test_retry_exhausted() -> None:
    """Test that exception is raised when retries exhausted."""

    @retry_on_error(max_retries=2, delay=0.1)
    def always_fails() -> None:
        raise ValueError("persistent error")

    with pytest.raises(ValueError):
        always_fails()


def test_retry_specific_exceptions() -> None:
    """Test that only specified exceptions trigger retry."""

    @retry_on_error(max_retries=2, delay=0.1, exceptions=(TypeError,))
    def raises_value_error() -> None:
        raise ValueError("not caught")

    with pytest.raises(ValueError):
        raises_value_error()


def test_api_error_inheritance() -> None:
    """Test custom exception hierarchy."""
    assert issubclass(RateLimitError, APIError)
    assert issubclass(APIError, Exception)
