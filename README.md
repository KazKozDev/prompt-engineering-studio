# Prompt Engineering Studio

[![CI](https://github.com/KazKozDev/prompt-engineering-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/KazKozDev/prompt-engineering-studio/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)

Local-first workbench for designing, evaluating, and deploying LLM prompts with scientific rigor.

## Why This Project

- **End-to-end workflow**: from prompt generation to systematic evaluation and deployment in a single tool.
- **Evaluation Lab as the core**: one place for Quality, Consistency, and Robustness testing, powered by advanced metrics (BERTScore, perplexity, semantic similarity).
- **Dedicated DSPy optimization layer**: standalone DSPy-powered workflows for automated prompt/program optimization, integrated with but not limited to Evaluation Lab.
- **Production-minded design**: caching, evaluation history, regression detection, Docker, CI, and a clean architecture that’s easy to extend.

## Overview


Prompt Engineering Studio is a production-grade tool for systematic prompt development. It combines 70+ research-backed prompting techniques with automated optimization, comprehensive evaluation, and deployment tracking.

**Status:** v2.0 Beta — Active development

## Contributing / Dev Setup (Quick)

- Fork or clone the repo
- Use local virtualenv + Makefile:
  ```bash
  make install   # create .venv and install Python deps
  make test      # run backend tests
  make dev       # start backend + frontend
  ```
- Configure providers via `.env` (see Installation section)

## Screenshots

<img width="1500" alt="Generator Interface" src="https://github.com/user-attachments/assets/9a5c60d2-fc37-4c8d-b5b6-bb4e33d4f3d3" />

*Generator: 70+ research-backed prompting techniques with paper citations and structure hints*

<img width="1540" alt="Evaluation Lab" src="https://github.com/user-attachments/assets/0249bfca-a979-437e-b54f-88990f70b65c" />

*Evaluation Lab: Comprehensive testing with Quality, Consistency, Robustness, and Advanced Metrics*


## Core Features

### 1. Generator
- **70+ Prompting Techniques** from research papers (2020-2025)
- Categories: Reasoning, Coding, Creative Writing, Data Extraction, Translation, Summarization
- Techniques include: Chain-of-Thought, ReAct, Tree of Thoughts, Self-Consistency, DSPy optimization, and more
- Each technique includes paper citation, arXiv link, and structure hints

### 2. DSPy Orchestrator (Dedicated Optimization Layer)
- Dedicated DSPy-powered programs for prompt and LLM pipeline optimization
- LangChain-based agent for task analysis and technique suggestion
- Multi-provider support (OpenAI, Claude, Gemini, Ollama)
- Iterative refinement with configurable strategies, separate from but compatible with Evaluation Lab

### 3. Dataset Manager
- Import from JSON, CSV, or HuggingFace datasets
- Manual dataset creation with schema preview
- Support for Q&A, classification, generation, and extraction tasks
- Dataset versioning and metadata tracking


### 4. Evaluation Lab ✅ **Production-Ready**

**Core Evaluation:**
- **Offline Benchmarks:** Accuracy, BLEU, ROUGE, BERTScore, semantic similarity
- **Label-Free Evaluation:** Self-Consistency, GLaPE, LLM-as-Judge
- **Robustness Testing:** Format variations, length stress tests, adversarial inputs
- **Unified Reports:** Comprehensive evaluation across all metrics

**Advanced Metrics** (NEW):
- **BERTScore:** Embedding-based semantic similarity using sentence-transformers
- **Perplexity:** Language model confidence for fluency assessment
- **Advanced Semantic Similarity:** Deep semantic understanding with embeddings
- Automatic calculation when dependencies installed
- Graceful degradation to basic metrics if not available

**Evaluation History & Monitoring** (NEW):
- **Automatic Tracking:** Every evaluation run saved with full metrics and metadata
- **Regression Detection:** Compare recent runs against baseline to catch performance drops
- **Trend Analysis:** Visualize metric changes over time (improving/stable/declining)
- **History Tab:** Dedicated UI for viewing statistics, detecting regressions, and analyzing trends
- **Response Caching:** Hash-based caching with TTL for faster iterations

**6 Evaluation Types:**
1. Quality (BLEU, ROUGE, BERTScore, Perplexity, LLM-as-Judge)
2. Consistency (Self-Consistency, Mutual/GLaPE)
3. Robustness (Format, Length, Adversarial)
4. Performance (Latency, Cost, Reliability)
5. Human (Rating, Ranking, A/B Testing)
6. Overview (Aggregated scores with advanced metrics)
7. History (Trends, regressions, statistics)


### 5. Prompt Library
- Version control for prompts
- Template management with categories and tags
- Generation history tracking
- Deployment status monitoring

### 6. Settings
- Multi-provider configuration (Ollama, OpenAI, Gemini, Anthropic)
- API key management
- Model selection per provider
- Workspace preferences

## Architecture

```
prompt-engineering-studio/
├── src/                      # Python backend (FastAPI)
│   ├── api_server.py         # Main API server (2125 lines)
│   ├── llm/                  # LLM client implementations
│   ├── evaluator/            # Evaluation metrics and methods
│   ├── prompts/              # Prompt templates and management
│   ├── storage/              # Data persistence
│   └── utils/                # Utilities (rate limiting, caching, logging)
├── frontend/                 # React + TypeScript UI
│   └── src/
│       ├── components/       # UI components (Generator, Optimizer, etc.)
│       └── services/         # API client
├── config/                   # Configuration files
│   ├── prompts.yaml          # 70+ technique definitions (668 lines)
│   ├── technique_templates.yaml
│   ├── model_config.yaml
│   └── tools_schema.json
├── data/                     # Datasets, cache, outputs
└── docs/                     # Documentation and references
```

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI + Uvicorn
- LangChain for agent orchestration
- DSPy for prompt optimization
- HuggingFace Datasets
- Multi-provider LLM clients (OpenAI, Anthropic, Google, Ollama)

**Frontend:**
- React 19 + TypeScript
- Vite build system
- React Markdown for documentation rendering
- Tailwind CSS (via postcss)

**Code Quality:**
- Black formatter
- Ruff linter (pycodestyle, pyflakes, isort, pydocstyle)
- Type hints (flake8-annotations)
- Google-style docstrings

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) Ollama for local models
- (Optional) CUDA-capable GPU for advanced metrics (recommended but not required)

### Quick Start

```bash
# Clone repository
git clone https://github.com/KazKozDev/prompt-engineering-studio.git
cd prompt-engineering-studio

# Preferred: use virtualenv + Makefile
make install      # creates .venv, installs Python deps
make test         # run backend tests

# Configure providers (create .env file)
cp .env.example .env
# Add your API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY

# Start full app (backend + frontend)
make dev
```

Application will open at `http://localhost:5173`

### Running in Docker

If you prefer containerized setup:

```bash
git clone https://github.com/KazKozDev/prompt-engineering-studio.git
cd prompt-engineering-studio

# Backend + frontend
docker compose up
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Manual Backend / Frontend Setup (Alternative)

```bash
# Backend setup (without Makefile)
pip install -r requirements.txt

# Optional: Install advanced evaluation metrics
# Note: This will download ~500MB of models (sentence-transformers, torch)
pip install sentence-transformers transformers torch numpy

# Frontend setup
cd frontend
npm install
cd ..

# Start application (macOS)
./start.command

# Or manually:
# Terminal 1: python src/api_server.py
# Terminal 2: cd frontend && npm run dev
```

### Advanced Metrics (Optional)

Advanced evaluation metrics (BERTScore, Perplexity, Semantic Similarity) require additional dependencies:

```bash
# Full installation with advanced metrics
pip install sentence-transformers>=2.2.0 transformers>=4.30.0 torch>=2.0.0 numpy>=1.24.0
```

**Note:** 
- First run will download models (~500MB total)
- Models are cached locally for future use
- Advanced metrics work without GPU but are faster with CUDA
- If not installed, basic metrics (BLEU, ROUGE, Jaccard) still work perfectly

## Configuration

### Environment Variables (.env)
```bash
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

### Provider Setup
Configure providers in **Settings** panel:
- **Ollama:** Local models (requires Ollama installation)
- **OpenAI:** Cloud-based models
- **Anthropic:** Claude models
- **Google:** Gemini models


## Usage Workflow

**Two Approaches:**

### Path 1: Manual Prompt Engineering (Generator)
1. **Describe Task** → Plain language description of what you need
2. **Select Techniques** → Choose from 70+ research-backed methods
3. **Generate Variants** → Create multiple prompt versions
4. **Evaluate** → Test against datasets in Evaluation Lab
5. **Refine** → Iterate based on metrics
6. **Save to Library** → Version control and deployment

### Path 2: Automated Optimization (DSPy Orchestrator)
1. **Define Task** → Business objective in plain language
2. **Provide Dataset** → Examples of input/output pairs
3. **Configure** → Select target model and quality profile
4. **Run Optimization** → LangChain ReAct agent orchestrates DSPy optimization
5. **Review Results** → Get optimized program with metrics
6. **Deploy** → Save artifact for production use

**Both paths support:**
- Multi-provider testing (Ollama, OpenAI, Anthropic, Google)
- Comprehensive evaluation (Quality, Consistency, Robustness)
- Performance monitoring (History, Regression Detection, Trends)


## Key Dependencies

```
fastapi>=0.104.0          # API framework
openai>=1.0.0             # OpenAI client
anthropic>=0.25.0         # Anthropic client
google-generativeai>=0.4.0 # Gemini client
datasets>=2.19.0          # HuggingFace datasets
pydantic>=2.0.0           # Data validation
pyyaml>=6.0.0             # Config parsing
tiktoken>=0.6.0           # Token counting
```

## Research Foundation

All prompting techniques are based on peer-reviewed research papers:
- **Chain-of-Thought** (Wei et al., 2022) - arXiv:2201.11903
- **ReAct** (Yao et al., 2022) - arXiv:2210.03629
- **Tree of Thoughts** (Yao et al., 2023) - arXiv:2305.10601
- **Self-Consistency** (Wang et al., 2022) - arXiv:2203.11171
- **DSPy** (Khattab et al., 2023) - arXiv:2310.03714
- And 65+ more techniques from 2020-2025

See `config/prompts.yaml` for complete list with citations.

## Development

### Code Style
```bash
# Format code
black .

# Lint
ruff check . --fix

# Run tests
pytest tests/
```

### Project Structure
- Follow GenAI project standards (see `.agent/workflows/`)
- Type hints required for all functions
- Google-style docstrings
- Configuration externalized to YAML files

### Local Tooling

- **Virtualenv:**
  - `.venv/` is used as the default virtual environment (not committed to git).
  - Recommended workflow:
    ```bash
    make install   # create .venv and install Python deps
    make test      # run backend tests via pytest
    make dev       # start backend + frontend for local development
    ```

- **Backend only:**
  ```bash
  make backend
  ```

- **Frontend only:**
  ```bash
  make frontend
  ```

### Docker & Docker Compose

- **Build backend image:**
  ```bash
  docker build -t prompt-engineering-studio-backend .
  ```

- **Run backend only:**
  ```bash
  docker run --rm -p 8000:8000 prompt-engineering-studio-backend
  ```

- **Run backend + frontend via Docker Compose:**
  ```bash
  docker compose up
  ```

  - Backend: http://localhost:8000
  - Frontend: http://localhost:5173

### Continuous Integration (GitHub Actions)

- CI config: `.github/workflows/ci.yml`
- On each push/PR to `main`:
  - Runs Python tests via `pytest`.
  - For `main` branch, additionally builds the backend Docker image (without pushing).

## Documentation

- **Getting Started Guides:** `docs/getting-started/` (9 comprehensive guides)
- **Method Documentation:** `docs/methods/` (technique deep-dives)
- **Research Papers:** `docs/references/` (19 PDF papers)
- **In-App Help:** Available in Help section of UI

## Roadmap

- [ ] Production metrics dashboard
- [ ] Real-time monitoring and alerting
- [ ] A/B testing framework
- [ ] Prompt branching and merging
- [ ] Multi-user collaboration
- [ ] API endpoint for production deployment
- [ ] Cost optimization recommendations

## License

MIT License - See LICENSE file

## Contributing

Contributions welcome. Please:
1. Follow existing code style (Black + Ruff)
2. Add type hints and docstrings
3. Update tests
4. Reference research papers for new techniques

## Links

- **GitHub:** https://github.com/KazKozDev/prompt-engineering-studio
- **Author:** Artem Kazakov (KazKozDev)
- **Issues:** https://github.com/KazKozDev/prompt-engineering-studio/issues

## Citation

If you use this tool in research, please cite:
```
@software{prompt_engineering_studio,
  author = {Kazakov, Artem},
  title = {Prompt Engineering Studio},
  year = {2025},
  url = {https://github.com/KazKozDev/prompt-engineering-studio}
}
```

---

**Note:** This is a beta release. Breaking changes may occur. For production use, pin to specific versions and test thoroughly.
