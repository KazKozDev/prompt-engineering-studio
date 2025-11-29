# GenAI Project Structure Instructions

## How to Use This Document

**CRITICAL: Understand the difference between RULES, TEMPLATES, and USER TASKS.**

### What is MANDATORY (follow always):
- Directory structure pattern
- Code style (Black, Ruff, type hints, docstrings)
- Configuration externalization (no hardcoded prompts/keys)
- Dependency verification
- Running verification checks before completion
- Validation checklist items

### What is TEMPLATE/EXAMPLE (use as reference, adapt to context):
- Code snippets in "Required Components" section — these are EXAMPLES of implementation, not code to copy verbatim
- Configuration YAML files — these are TEMPLATES showing structure, not actual content
- Test files — these show PATTERNS, adapt to actual code being tested

### What comes from USER (highest priority):
- **The actual task** — what to build, refactor, or fix
- **Existing codebase** — preserve and improve, do NOT delete and replace
- **Specific requirements** — user's instructions override examples

### Behavioral Rules

1. **NEVER delete existing user code to replace with template code**
2. **ALWAYS ask clarifying questions if task is ambiguous**
3. **When refactoring**: improve existing code to match standards, don't rewrite from scratch
4. **When creating new**: use templates as structural guide, implement user's actual requirements
5. **Templates are NOT the task** — they show HOW to structure code, not WHAT to build
6. **NEVER say "done" without running verification checks**

### Example Scenarios

**User says**: "Refactor my LLM client to match your standards"
- ✅ DO: Add type hints, docstrings, extract config, keep user's logic
- ❌ DON'T: Delete user's code and paste BaseLLMClient template

**User says**: "Create a new project for sentiment analysis"
- ✅ DO: Use directory structure, create files following patterns, implement sentiment analysis
- ❌ DON'T: Create generic "summarize" and "extract" templates from examples

**User says**: "Add caching to my existing code"
- ✅ DO: Integrate ResponseCache pattern into user's existing architecture
- ❌ DON'T: Replace user's code with cache.py template verbatim

---

## Activation

Apply these rules when:
- Creating a new project that uses LLM/GenAI capabilities
- Refactoring existing GenAI code
- Adding LLM functionality to an existing project
- Reviewing GenAI project structure

## Directory Structure

Use this structure for all GenAI projects:
````
{project_name}/
├── config/
│   ├── __init__.py
│   ├── model_config.yaml
│   ├── prompts.yaml
│   └── logging_config.yaml
├── src/
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── claude_client.py
│   │   ├── gpt_client.py
│   │   └── utils.py
│   ├── prompts/
│   │   ├── __init__.py
│   │   ├── templates.py
│   │   ├── few_shot.py
│   │   └── chainer.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── rate_limiter.py
│   │   ├── token_counter.py
│   │   ├── cache.py
│   │   └── logger.py
│   └── handlers/
│       ├── __init__.py
│       └── error_handler.py
├── data/
│   ├── cache/
│   ├── prompts/
│   ├── outputs/
│   └── embeddings/
├── examples/
├── tests/
├── .env.example
├── .gitignore
├── pyproject.toml
├── requirements.txt
├── README.md
└── Dockerfile
````

## Code Style & Formatting

### Tools

All Python code MUST be formatted with:
- **Black** — code formatter
- **Ruff** — linter (replaces flake8, isort)

### Configuration

Add to `pyproject.toml`:
````toml
[tool.black]
line-length = 88
target-version = ["py311"]

[tool.ruff]
line-length = 88
select = [
    "E",      # pycodestyle errors
    "F",      # pyflakes
    "I",      # isort
    "UP",     # pyupgrade
    "B",      # flake8-bugbear
    "D",      # pydocstyle (docstrings)
    "ANN",    # flake8-annotations (type hints)
]
ignore = [
    "E501",   # line length handled by black
    "D100",   # missing docstring in public module
    "D104",   # missing docstring in public package
    "ANN101", # missing type annotation for self
    "ANN102", # missing type annotation for cls
]

[tool.ruff.pydocstyle]
convention = "google"
````

### Type Hints

All functions and methods MUST have type annotations:
````python
# WRONG
def process_response(response, max_length):
    return response[:max_length]

# CORRECT
def process_response(response: str, max_length: int) -> str:
    return response[:max_length]
````

For complex types, use `typing` module:
````python
from typing import Optional, List, Dict, Any, Union

def chat(
    messages: List[Dict[str, str]],
    temperature: Optional[float] = None,
) -> Dict[str, Any]:
    ...
````

### Docstrings

Use Google style docstrings for all public functions, classes, and methods:
````python
def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """Count the number of tokens in text.

    Args:
        text: The input text to tokenize.
        model: The tokenizer model to use.

    Returns:
        The number of tokens in the text.

    Raises:
        ValueError: If the model is not supported.
    """
    ...
````

### Commands
````bash
black .              # format all
ruff check . --fix   # lint and auto-fix
````

### Dependency Management

**MANDATORY**: All imports must have corresponding entries in `requirements.txt`.

#### Tools for verification:
````bash
# Generate requirements from code imports
pipreqs . --force --savepath requirements_check.txt

# Compare with existing requirements
diff requirements.txt requirements_check.txt

# Check for conflicts in installed packages
pip check

# Security audit
pip-audit
````

#### Rules:
1. **Before completing any task**, run `pipreqs . --print` to verify all imports are covered
2. **New import = new requirement** — if you add an import, add the package to requirements.txt
3. **Pin versions** — use `>=` for flexibility or `==` for reproducibility

### Pre-commit Hook (optional)

Add `.pre-commit-config.yaml`:
````yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.4.0
    hooks:
      - id: black
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
````

## Mandatory Rules

**ALWAYS** extract to `config/`:
- Model parameters (temperature, max_tokens, model_name)
- Prompt templates
- API endpoints
- Logging settings

**NEVER** hardcode:
- Prompt text in source files
- Model names in code
- API keys or secrets

## Configuration Templates

> **Note**: These are STRUCTURAL TEMPLATES. Adapt content to user's actual project requirements.

### model_config.yaml:
````yaml
models:
  default: claude
  
  claude:
    model_name: claude-sonnet-4-5
    max_tokens: 4096
    temperature: 0.7
    
  gpt:
    model_name: gpt-5
    max_tokens: 4096
    temperature: 0.7

rate_limits:
  requests_per_minute: 50
  tokens_per_minute: 100000

cache:
  enabled: true
  ttl_seconds: 3600
````

### prompts.yaml:
````yaml
system_prompts:
  default: |
    You are a helpful assistant.
    
  analyst: |
    You are a data analyst. 
    Provide structured, factual responses.

templates:
  summarize: |
    Summarize the following text:
    {text}
    
  extract: |
    Extract {entity_type} from:
    {text}
````

### logging_config.yaml:
````yaml
version: 1
disable_existing_loggers: false

formatters:
  standard:
    format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  detailed:
    format: "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"

handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: standard
    stream: ext://sys.stdout
  file:
    class: logging.handlers.RotatingFileHandler
    level: DEBUG
    formatter: detailed
    filename: data/outputs/app.log
    maxBytes: 10485760  # 10MB
    backupCount: 5

loggers:
  src.llm:
    level: DEBUG
    handlers: [console, file]
    propagate: false
  src.utils:
    level: INFO
    handlers: [console, file]
    propagate: false

root:
  level: INFO
  handlers: [console]
````

### .env.example:
````bash
# LLM API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Optional: Override config values
LLM_MODEL=claude-sonnet-4-5
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7

# Logging
LOG_LEVEL=INFO

# Cache
CACHE_ENABLED=true
CACHE_TTL_SECONDS=3600
````

### .gitignore:
````gitignore
# Environment
.env
.env.local

# Cache
data/cache/
__pycache__/
*.pyc

# Outputs
data/outputs/*.log
data/outputs/*.json

# IDE
.vscode/
.idea/

# Testing
.coverage
htmlcov/
.pytest_cache/

# Dependencies
requirements_check.txt
````

## Required Components

> **Note**: These are IMPLEMENTATION PATTERNS. Use as reference for structure and style, adapt logic to user's requirements.

### Base LLM Client (src/llm/base.py):
````python
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class BaseLLMClient(ABC):
    """Abstract base class for LLM clients."""

    def __init__(self, config: Dict[str, Any]) -> None:
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
    def chat(self, messages: List[Dict[str, str]], **kwargs: Any) -> str:
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
````

### Rate Limiter (src/utils/rate_limiter.py):
````python
import time
from collections import deque
from threading import Lock
from typing import Dict, Any


class RateLimiter:
    """Rate limiter using sliding window algorithm."""

    def __init__(self, requests_per_minute: int) -> None:
        """Initialize the rate limiter.

        Args:
            requests_per_minute: Maximum allowed requests per minute.
        """
        self.rpm = requests_per_minute
        self.timestamps: deque[float] = deque()
        self.lock = Lock()

    def acquire(self) -> None:
        """Acquire permission to make a request, blocking if necessary."""
        with self.lock:
            now = time.time()
            while self.timestamps and self.timestamps[0] < now - 60:
                self.timestamps.popleft()

            if len(self.timestamps) >= self.rpm:
                sleep_time = 60 - (now - self.timestamps[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)

            self.timestamps.append(time.time())

    def get_current_usage(self) -> Dict[str, Any]:
        """Get current rate limit usage statistics.

        Returns:
            Dictionary with usage stats.
        """
        with self.lock:
            now = time.time()
            while self.timestamps and self.timestamps[0] < now - 60:
                self.timestamps.popleft()
            return {
                "requests_used": len(self.timestamps),
                "requests_limit": self.rpm,
                "requests_remaining": self.rpm - len(self.timestamps),
            }
````

### Token Counter (src/utils/token_counter.py):
````python
import tiktoken
from typing import List


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

    def split_by_tokens(self, text: str, chunk_size: int) -> List[str]:
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
````

### Cache (src/utils/cache.py):
````python
import hashlib
import json
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta


class ResponseCache:
    """File-based cache for LLM responses."""

    def __init__(self, cache_dir: str, ttl_seconds: int = 3600) -> None:
        """Initialize the cache.

        Args:
            cache_dir: Directory to store cache files.
            ttl_seconds: Time-to-live for cache entries in seconds.
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = timedelta(seconds=ttl_seconds)

    def _hash_key(self, prompt: str, model: str) -> str:
        """Generate a hash key for the cache entry.

        Args:
            prompt: The prompt text.
            model: The model name.

        Returns:
            SHA256 hash string.
        """
        content = f"{model}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, prompt: str, model: str) -> Optional[str]:
        """Retrieve a cached response.

        Args:
            prompt: The prompt text.
            model: The model name.

        Returns:
            Cached response or None if not found/expired.
        """
        key = self._hash_key(prompt, model)
        path = self.cache_dir / f"{key}.json"

        if not path.exists():
            return None

        data = json.loads(path.read_text())
        cached_time = datetime.fromisoformat(data["timestamp"])

        if datetime.now() - cached_time > self.ttl:
            path.unlink()
            return None

        return data["response"]

    def set(self, prompt: str, model: str, response: str) -> None:
        """Store a response in cache.

        Args:
            prompt: The prompt text.
            model: The model name.
            response: The response to cache.
        """
        key = self._hash_key(prompt, model)
        path = self.cache_dir / f"{key}.json"

        data = {
            "timestamp": datetime.now().isoformat(),
            "response": response,
        }
        path.write_text(json.dumps(data))

    def clear(self) -> int:
        """Clear all cache entries.

        Returns:
            Number of entries cleared.
        """
        count = 0
        for path in self.cache_dir.glob("*.json"):
            path.unlink()
            count += 1
        return count
````

### Error Handler (src/handlers/error_handler.py):
````python
import time
import logging
from functools import wraps
from typing import Callable, Type, Tuple, TypeVar, Any, Optional

logger = logging.getLogger(__name__)

T = TypeVar("T")


class APIError(Exception):
    """Base exception for API errors."""

    pass


class RateLimitError(APIError):
    """Exception raised when rate limit is exceeded."""

    pass


def retry_on_error(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator to retry a function on specified exceptions.

    Args:
        max_retries: Maximum number of retry attempts.
        delay: Initial delay between retries in seconds.
        backoff: Multiplier for delay after each retry.
        exceptions: Tuple of exception types to catch.

    Returns:
        Decorated function with retry logic.
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception: Optional[Exception] = None
            current_delay = delay

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(
                            f"Attempt {attempt + 1} failed: {e}. "
                            f"Retrying in {current_delay}s..."
                        )
                        time.sleep(current_delay)
                        current_delay *= backoff

            raise last_exception  # type: ignore[misc]

        return wrapper

    return decorator
````

### Logger Setup (src/utils/logger.py):
````python
import logging
import logging.config
from pathlib import Path
from typing import Optional

import yaml


def setup_logging(config_path: Optional[str] = None) -> None:
    """Configure logging from YAML config file.

    Args:
        config_path: Path to logging config file.
            Defaults to config/logging_config.yaml.
    """
    if config_path is None:
        config_path = "config/logging_config.yaml"

    config_file = Path(config_path)

    if config_file.exists():
        with open(config_file) as f:
            config = yaml.safe_load(f)

        # Ensure log directory exists
        for handler in config.get("handlers", {}).values():
            if "filename" in handler:
                Path(handler["filename"]).parent.mkdir(parents=True, exist_ok=True)

        logging.config.dictConfig(config)
    else:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance.

    Args:
        name: Logger name (typically __name__).

    Returns:
        Configured logger instance.
    """
    return logging.getLogger(name)
````

## Required Tests

> **Note**: These are TEST PATTERNS. Write tests for user's actual implementation, not these examples.

Every GenAI project must include tests for core utilities. Create tests in `tests/` directory.

### Structure:
````
tests/
├── __init__.py
├── conftest.py
├── test_rate_limiter.py
├── test_token_counter.py
├── test_cache.py
└── test_error_handler.py
````

### conftest.py:
````python
import pytest
import tempfile
from pathlib import Path


@pytest.fixture
def temp_dir():
    """Provide a temporary directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)
````

### test_rate_limiter.py:
````python
import time
import pytest
from src.utils.rate_limiter import RateLimiter


def test_rate_limiter_allows_requests_under_limit():
    """Test that requests under limit pass through."""
    limiter = RateLimiter(requests_per_minute=10)
    for _ in range(5):
        limiter.acquire()
    assert limiter.get_current_usage()["requests_used"] == 5


def test_rate_limiter_blocks_when_limit_exceeded():
    """Test that requests are blocked when limit is exceeded."""
    limiter = RateLimiter(requests_per_minute=2)
    limiter.acquire()
    limiter.acquire()

    start = time.time()
    limiter.acquire()
    elapsed = time.time() - start

    assert elapsed >= 0.5  # Should have waited


def test_rate_limiter_resets_after_window():
    """Test that rate limiter resets after time window."""
    limiter = RateLimiter(requests_per_minute=60)
    limiter.acquire()
    assert limiter.get_current_usage()["requests_used"] == 1


def test_get_current_usage_returns_correct_format():
    """Test that usage stats have correct structure."""
    limiter = RateLimiter(requests_per_minute=10)
    usage = limiter.get_current_usage()

    assert "requests_used" in usage
    assert "requests_limit" in usage
    assert "requests_remaining" in usage
    assert usage["requests_limit"] == 10
````

### test_token_counter.py:
````python
import pytest
from src.utils.token_counter import TokenCounter


def test_count_empty_string():
    """Test counting tokens in empty string."""
    counter = TokenCounter()
    assert counter.count("") == 0


def test_count_simple_text():
    """Test counting tokens in simple text."""
    counter = TokenCounter()
    count = counter.count("Hello world")
    assert count > 0
    assert isinstance(count, int)


def test_truncate_under_limit():
    """Test truncation when under token limit."""
    counter = TokenCounter()
    text = "Short text"
    result = counter.truncate(text, max_tokens=100)
    assert result == text


def test_truncate_over_limit():
    """Test truncation when over token limit."""
    counter = TokenCounter()
    text = "This is a longer text that should be truncated"
    result = counter.truncate(text, max_tokens=5)
    assert counter.count(result) <= 5


def test_split_by_tokens():
    """Test splitting text by token count."""
    counter = TokenCounter()
    text = "One two three four five six seven eight nine ten"
    chunks = counter.split_by_tokens(text, chunk_size=3)
    assert len(chunks) > 1
    for chunk in chunks:
        assert counter.count(chunk) <= 3


def test_split_by_tokens_single_chunk():
    """Test splitting when text fits in one chunk."""
    counter = TokenCounter()
    text = "Short"
    chunks = counter.split_by_tokens(text, chunk_size=100)
    assert len(chunks) == 1
````

### test_cache.py:
````python
import pytest
import time
from src.utils.cache import ResponseCache


@pytest.fixture
def cache(temp_dir):
    """Provide a cache instance with short TTL."""
    return ResponseCache(cache_dir=str(temp_dir), ttl_seconds=2)


def test_cache_set_and_get(cache):
    """Test basic cache set and get."""
    cache.set("prompt", "model", "response")
    result = cache.get("prompt", "model")
    assert result == "response"


def test_cache_miss(cache):
    """Test cache miss returns None."""
    result = cache.get("nonexistent", "model")
    assert result is None


def test_cache_expiration(cache):
    """Test that cache entries expire."""
    cache.set("prompt", "model", "response")
    time.sleep(3)
    result = cache.get("prompt", "model")
    assert result is None


def test_cache_different_models(cache):
    """Test that different models have separate cache entries."""
    cache.set("prompt", "model_a", "response_a")
    cache.set("prompt", "model_b", "response_b")

    assert cache.get("prompt", "model_a") == "response_a"
    assert cache.get("prompt", "model_b") == "response_b"


def test_cache_clear(cache):
    """Test clearing all cache entries."""
    cache.set("prompt1", "model", "response1")
    cache.set("prompt2", "model", "response2")

    count = cache.clear()
    assert count == 2
    assert cache.get("prompt1", "model") is None


def test_cache_overwrite(cache):
    """Test that setting same key overwrites value."""
    cache.set("prompt", "model", "response1")
    cache.set("prompt", "model", "response2")
    assert cache.get("prompt", "model") == "response2"
````

### test_error_handler.py:
````python
import pytest
from src.handlers.error_handler import retry_on_error, APIError, RateLimitError


def test_retry_succeeds_first_attempt():
    """Test function that succeeds on first attempt."""
    call_count = 0

    @retry_on_error(max_retries=3)
    def always_works():
        nonlocal call_count
        call_count += 1
        return "success"

    result = always_works()
    assert result == "success"
    assert call_count == 1


def test_retry_succeeds_after_failures():
    """Test function that succeeds after retries."""
    call_count = 0

    @retry_on_error(max_retries=3, delay=0.1)
    def fails_twice():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ValueError("temporary error")
        return "success"

    result = fails_twice()
    assert result == "success"
    assert call_count == 3


def test_retry_exhausted():
    """Test that exception is raised when retries exhausted."""

    @retry_on_error(max_retries=2, delay=0.1)
    def always_fails():
        raise ValueError("persistent error")

    with pytest.raises(ValueError):
        always_fails()


def test_retry_specific_exceptions():
    """Test that only specified exceptions trigger retry."""

    @retry_on_error(max_retries=2, delay=0.1, exceptions=(TypeError,))
    def raises_value_error():
        raise ValueError("not caught")

    with pytest.raises(ValueError):
        raises_value_error()


def test_api_error_inheritance():
    """Test custom exception hierarchy."""
    assert issubclass(RateLimitError, APIError)
    assert issubclass(APIError, Exception)
````

### requirements.txt:
````
# Core
anthropic>=0.25.0
openai>=1.0.0
tiktoken>=0.6.0
pyyaml>=6.0.0
python-dotenv>=1.0.0

# Code Quality
black>=24.0.0
ruff>=0.4.0

# Dependency Management
pipreqs>=0.5.0
pip-audit>=2.7.0

# Testing
pytest>=8.0.0
pytest-cov>=4.0.0
````

### Run tests command:
````bash
pytest tests/ -v --cov=src --cov-report=term-missing
````

## Mandatory Verification Before Completion

**CRITICAL: NEVER say "done" or "ready" without running these checks.**

### Verification Steps (run in order):
````bash
# 1. Syntax check
python -m py_compile src/**/*.py

# 2. Linting
ruff check .

# 3. Formatting check
black --check .

# 4. Dependency check
pipreqs . --print | grep -v "^#" > /tmp/imports.txt
# Verify all listed packages are in requirements.txt

# 5. Install dependencies
pip install -r requirements.txt

# 6. Run tests
pytest tests/ -v

# 7. Try to import main modules
python -c "from src.llm import base; from src.utils import cache, rate_limiter"
````

### Verification Checklist (must pass ALL):

| Check | Command | Expected |
|-------|---------|----------|
| Syntax | `python -m py_compile file.py` | No output (success) |
| Lint | `ruff check .` | No errors |
| Format | `black --check .` | No reformatting needed |
| Dependencies | `pip install -r requirements.txt` | All packages install |
| Tests | `pytest tests/ -v` | All tests pass |
| Import | `python -c "import src"` | No ImportError |

### On Failure:

1. **Syntax error** → Fix the code, don't just report it
2. **Missing dependency** → Add to requirements.txt, install, verify
3. **Test failure** → Fix the code or test, run again
4. **Import error** → Check file structure, `__init__.py` files, requirements

### Response Format After Verification:
````
Verification completed:
- Syntax: passed
- Lint: passed (or: X warnings, not blocking)
- Tests: 15 passed, 0 failed
- Dependencies: all installed

[Then provide deliverable]
````

### NEVER:
- Say "should work" without running
- Say "you can test by..." — YOU test it
- Skip verification because "it's a small change"
- Assume imports are available without checking requirements.txt

## Validation Checklist

Before completing any GenAI project task, verify:

### Code Style
- [ ] `pyproject.toml` contains Black and Ruff config
- [ ] Code passes `black --check .`
- [ ] Code passes `ruff check .`
- [ ] All functions have type hints
- [ ] All public functions/classes have Google-style docstrings

### Structure & Config
- [ ] Prompts are externalized to YAML or separate files
- [ ] Model parameters are in `config/`
- [ ] `logging_config.yaml` is configured
- [ ] `.env.example` exists with all required variables
- [ ] `.gitignore` excludes `.env`, cache, and outputs
- [ ] Base class exists for LLM clients

### Core Components
- [ ] Rate limiting is implemented
- [ ] Token counting is in place
- [ ] Caching is configured
- [ ] Error handling includes retry logic

### Security & Logging
- [ ] Secrets use environment variables (loaded from `.env`)
- [ ] Request/response logging is enabled
- [ ] No API keys in code or config files

### Dependencies
- [ ] All imports have corresponding entries in `requirements.txt`
- [ ] `pipreqs . --print` matches requirements.txt
- [ ] `pip install -r requirements.txt` succeeds
- [ ] No version conflicts (`pip check`)

### Testing
- [ ] Tests exist for all utilities (rate limiter, cache, token counter, error handler)
- [ ] Tests pass: `pytest tests/ -v`
- [ ] Coverage is acceptable: `pytest --cov=src`

### Verification (run before saying "done")
- [ ] `python -m py_compile` passes on all files
- [ ] `ruff check .` shows no errors
- [ ] `black --check .` shows no changes needed
- [ ] Main modules import without error
- [ ] All tests pass

## README Standards

### Principles:
- **No emojis** — ever
- **No fluff** — every sentence must carry information
- **No repetition** — say it once, say it right
- **Code over prose** — show, don't explain

### Template (only include sections that apply):
````markdown
# Project Name

One sentence: what it does.

## Install
```bash
pip install -r requirements.txt
cp .env.example .env
# add your API keys to .env
```

## Usage
```python
from src.llm import ClaudeClient

client = ClaudeClient()
response = client.chat([{"role": "user", "content": "Hello"}])
```

## Config

Edit `config/model_config.yaml`:
- `model_name`: claude-sonnet-4-5 | gpt-5
- `temperature`: 0.0-1.0
- `max_tokens`: up to 4096

## Project Structure
````
src/
├── llm/        # LLM clients
├── prompts/    # Prompt management  
├── utils/      # Rate limiter, cache, tokens
└── handlers/   # Error handling
Tests
bashpytest tests/ -v
````

## License

MIT
````

### Section Rules:

| Section | Rule |
|---------|------|
| Title | Name only, no tagline |
| Description | 1 sentence max, no "This project..." |
| Install | Commands only, comments for non-obvious steps |
| Usage | Minimal working example, no "First you need to..." |
| Config | Table or list of actual options, no defaults explanation |
| Structure | Tree with 1-3 word descriptions |
| Tests | Command only |
| License | One word/line |

### NEVER include:
- Badges (build status, coverage, etc.) unless CI is configured
- "Table of Contents" for READMEs under 100 lines
- "Contributing" section for personal projects
- "Acknowledgments" or "Credits"
- Explanations of what Python/pip/git is
- "Prerequisites: Python 3.11" — put in Install if needed
- Screenshots unless UI exists

### NEVER write:
- "This project is a..."
- "In order to..."
- "You will need to..."
- "Make sure you have..."
- "Don't forget to..."
- "Please note that..."
- "It's important to..."

### Word budget:
- Description: 15 words max
- Each section intro: 0 words (just show the code/config)
- Comments in code: 5 words max

## Antipatterns to Flag

When reviewing code, flag these patterns:

**WRONG:**
````python
response = client.complete("Summarize this: " + text)
````

**CORRECT:**
````python
prompt = templates.get("summarize").format(text=text)
response = client.complete(prompt)
````

---

**WRONG:**
````python
client = OpenAI(model="gpt-5")
````

**CORRECT:**
````python
client = LLMClient(config["models"]["default"])
````

---

**WRONG:**
````python
response = api.call(prompt)
````

**CORRECT:**
````python
@retry_on_error(max_retries=3)
def call_api(prompt):
    return api.call(prompt)
````

---

**WRONG:**
````python
for item in items:
    process(item)
````

**CORRECT:**
````python
rate_limiter = RateLimiter(rpm=50)
for item in items:
    rate_limiter.acquire()
    process(item)
````

---

**WRONG:**
````python
def process(data):
    return data.strip()
````

**CORRECT:**
````python
def process(data: str) -> str:
    """Process input data by stripping whitespace.

    Args:
        data: The input string to process.

    Returns:
        The stripped string.
    """
    return data.strip()
````

---

**WRONG:**
````python
import os
api_key = "sk-1234567890"
````

**CORRECT:**
````python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
````

---

**WRONG:**
````python
import requests  # not in requirements.txt
````

**CORRECT:**
````python
# requirements.txt includes: requests>=2.31.0
import requests
````

## Working With User Code

### When User Provides Existing Code:
1. **Analyze first** — understand what the code does
2. **Identify gaps** — what doesn't match standards
3. **Propose changes** — explain what will be improved
4. **Refactor incrementally** — preserve functionality, improve structure
5. **Run verification** — confirm it works

### When User Requests New Feature:
1. **Clarify requirements** — what exactly should it do
2. **Plan implementation** — where it fits in structure
3. **Implement to spec** — user's requirements, your standards
4. **Update requirements.txt** — add any new dependencies
5. **Run verification** — confirm it works
6. **Verify checklist** — ensure compliance

### NEVER:
- Assume templates ARE the task
- Delete working code without explicit permission
- Ignore user's existing architecture choices
- Replace custom logic with generic examples
- Say "done" without running verification
- Leave imports without requirements.txt entries