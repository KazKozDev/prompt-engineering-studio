# Prompt Engineering Studio (Beta)

Prompt Engineering Studio is a local-first workbench for designing, evaluating, and deploying LLM prompts in a structured, reproducible way.

> Status: **v2.0 Beta** — active development, breaking changes possible.


<img width="1500" height="1049" alt="Screenshot 2025-12-02 at 22 54 55" src="https://github.com/user-attachments/assets/9a5c60d2-fc37-4c8d-b5b6-bb4e33d4f3d3" />

## Features

- Prompt generator with 30+ prompting techniques
- DSPy-based orchestrator for automated prompt optimization
- Dataset manager and evaluation lab with metrics
- Prompt library with history and (planned) production metrics

## Getting Started

```bash
git clone https://github.com/KazKozDev/prompt-engineering-studio.git
cd prompt-engineering-studio

# Backend (Python 3.11+)
pip install -r requirements.txt
python -m src.api.app  # or your preferred entrypoint

# Frontend
cd frontend
npm install
npm run dev
```

Configure providers and models under **Settings** in the UI. DSPy, Ollama, OpenAI, Gemini, and Anthropic are supported via the backend configuration.
