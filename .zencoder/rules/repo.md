---
description: Repository Information Overview
alwaysApply: true
---

# Prompt Engineering Studio Information

## Summary

Prompt Engineering Studio is a web application that automatically transforms user input into optimized prompts using 20+ advanced prompt engineering techniques. It supports multiple LLM providers (Gemini, Ollama, OpenAI) and provides both a React frontend interface and FastAPI backend for generation, evaluation, and management of enhanced prompts.

## Repository Structure

- **backend** (`src/`): Python FastAPI server providing REST API endpoints for LLM integration
- **frontend** (`frontend/`): React + TypeScript web interface with Vite build system
- **config**: YAML configuration files for models, prompts, and logging
- **data**: Storage for datasets, cache, outputs, embeddings, and templates
- **tests**: Python unit tests for utilities and handlers
- **docs**: Documentation and implementation guides

### Main Components
- **API Server** (`src/api_server.py`): FastAPI application with endpoints for prompt generation, history, templates, and datasets
- **LLM Clients** (`src/llm/`): Integration for Gemini, Ollama, and OpenAI providers
- **Prompt Management** (`src/prompts/`): Handles prompt templates and technique transformations
- **Storage Layer** (`src/storage/`): History and template persistence
- **Frontend UI**: React components for prompt optimization, evaluation, dataset generation, and DSPy orchestration

## Language & Runtime

**Python Backend**:
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Package Manager**: pip
- **Build/Run Tool**: Uvicorn (ASGI server)

**Frontend**:
- **Language**: TypeScript ~5.9.3
- **Runtime**: Node.js v16+
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Package Manager**: npm

## Dependencies

### Backend (Python)
**Main Dependencies**:
- `fastapi>=0.104.0` - Web framework
- `uvicorn>=0.24.0` - ASGI server
- `pydantic>=2.0.0` - Data validation
- `anthropic>=0.25.0` - Claude API client
- `openai>=1.0.0` - OpenAI API client
- `google-generativeai>=0.4.0` - Google Gemini API client
- `pyyaml>=6.0.0` - Configuration parsing
- `python-dotenv>=1.0.0` - Environment variables
- `requests>=2.31.0` - HTTP client
- `tiktoken>=0.6.0` - Token counting

**Development Dependencies**:
- `pytest>=8.0.0` - Testing framework
- `pytest-cov>=4.0.0` - Test coverage
- `black>=24.0.0` - Code formatter
- `ruff>=0.4.0` - Linter

### Frontend (Node.js)
**Main Dependencies**:
- `react@^19.2.0` - UI library
- `react-dom@^19.2.0` - React DOM rendering
- `react-markdown@^10.1.0` - Markdown rendering
- `remark-gfm@^4.0.1` - GitHub Flavored Markdown support

**Dev Dependencies**:
- `typescript~5.9.3` - TypeScript compiler
- `@vitejs/plugin-react@^5.1.1` - Vite React plugin
- `vite@^7.2.4` - Build tool
- `eslint@^9.39.1` - Linter
- `@types/react@^19.2.5`, `@types/react-dom@^19.2.3` - Type definitions

## Build & Installation

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server (development)
uvicorn src.api_server:app --reload --host 0.0.0.0 --port 8000

# Run FastAPI server (production)
uvicorn src.api_server:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Development server (HMR enabled)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Full Development Setup
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Start both concurrently (in separate terminals)
# Terminal 1: Backend
uvicorn src.api_server:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Testing

### Backend
**Framework**: Pytest  
**Test Location**: `tests/`  
**Test Files**: `test_cache.py`, `test_error_handler.py`, `test_rate_limiter.py`, `test_token_counter.py`

**Run Tests**:
```bash
pytest
pytest --cov=src  # With coverage
```

### Frontend
**Linting**:
```bash
cd frontend
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

**Type Checking**:
```bash
cd frontend
tsc -b  # TypeScript build
```

## Configuration

### Model Configuration (`config/model_config.yaml`)
Defines LLM provider settings, rate limits, and cache configuration:
- **Gemini**: `gemini-2.5-flash-preview-04-17` (max_tokens: 4096, temp: 0.7)
- **Ollama**: Local HTTP endpoint with `llama3:8b` (configurable)
- **OpenAI**: GPT-5 configuration (planned)
- **Rate Limits**: 50 requests/min, 100k tokens/min
- **Cache**: TTL 3600 seconds

### Prompts Configuration (`config/prompts.yaml`)
Contains 20+ prompt engineering techniques with descriptions, authors, and arxiv references:
- Basic: Zero-Shot, Few-Shot, Role Prompting
- Advanced Reasoning: Chain-of-Thought, Tree of Thoughts, Graph of Thoughts, ReAct
- Meta-Cognitive: Self-Consistency, Self-Critique, Metacognitive Prompting, Reflection
- Modern: Meta-Prompting, TextGrad Optimization, System Prompt Optimization, Visual CoT

## Main Files & Resources

**Backend Entry Points**:
- `src/api_server.py`: FastAPI application (main entry point)
- `src/dspy_orchestrator.py`: DSPy workflow orchestration
- `src/dataset_generator.py`: Synthetic dataset generation
- `src/dataset_manager.py`: Dataset management

**Frontend Entry Points**:
- `frontend/src/main.tsx`: React application entry point
- `frontend/src/App.tsx`: Main application component
- `frontend/index.html`: HTML template

**API Endpoints**:
- `/api/techniques` - List all prompt techniques
- `/api/tasks` - Available task types
- `/api/models/{provider}` - Model information by provider
- `/api/generate` - Generate enhanced prompts (POST, streaming)
- `/api/generate-title` - Generate session titles
- `/api/history` - Retrieve generation history
- `/api/templates` - Manage custom templates (CRUD)
- `/api/datasets` - Dataset operations

**Configuration Files**:
- `config/model_config.yaml` - LLM provider settings
- `config/prompts.yaml` - Prompt technique templates (668 lines)
- `config/logging_config.yaml` - Logging configuration
- `config/tools_schema.json` - Tool schema definitions
- `config/technique_templates.yaml` - Advanced technique templates

**Data Storage**:
- `data/cache/` - Response caching
- `data/outputs/` - Generated outputs
- `data/datasets/` - Dataset files
- `data/embeddings/` - Embedding storage
- `data/history/` - Generation history
- `data/templates/` - User-defined templates

## Environment Configuration

Create `.env` file in root directory:
```bash
# Google Gemini
GEMINI_API_KEY=your_api_key_here

# OpenAI
OPENAI_API_KEY=your_api_key_here

# Anthropic
ANTHROPIC_API_KEY=your_api_key_here

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
```

Frontend environment: `frontend/.env.local` for API endpoints if needed.

## Code Quality

**Python**:
- Formatter: Black (line-length: 88)
- Linter: Ruff with plugins for docstrings, type hints, and bug detection
- Docstring Convention: Google style
- Type Hints: Required for all functions/methods (via ANN plugin)

**Frontend**:
- Linter: ESLint with TypeScript support
- TypeScript: Strict mode enabled

**Pre-Commit Commands**:
```bash
# Python
black .
ruff check . --fix

# Frontend
cd frontend && npm run lint -- --fix
```

## Key Features

- **20+ Prompt Techniques**: From Zero-Shot to advanced Tree of Thoughts
- **Multi-Provider LLM Support**: Gemini, Ollama (local), OpenAI (planned)
- **Real-time Streaming**: Streaming responses from backend
- **Prompt History**: Persistent storage of generations
- **Custom Templates**: Save and reuse prompt templates
- **Dataset Generation**: Synthetic dataset creation for evaluation
- **DSPy Orchestration**: Advanced LLM orchestration workflows
- **Evaluation Tools**: Robustness, quality, performance, consistency analysis
- **Academic References**: Citations and arxiv links for all techniques

